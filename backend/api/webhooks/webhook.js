/**
 * Webhook Handler for Mobile Money Payment Confirmation
 * 
 * This script automatically activates user subscriptions when they
 * complete payment by entering their PIN on their phone.
 * 
 * Supports: Flutterwave, MTN MoMo, Airtel Money
 */

const crypto = require('crypto');

// Database connection (adjust based on your setup)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SMS service for notifications
const smsService = require('../../services/smsService');

// Push notification service
const pushService = require('../../services/pushNotificationService');

/**
 * Verify webhook signature to ensure request is from Flutterwave
 */
function verifyFlutterwaveSignature(req) {
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  
  if (!signature || signature !== secretHash) {
    console.error('Invalid webhook signature');
    return false;
  }
  
  return true;
}

/**
 * Verify MTN MoMo webhook signature
 */
function verifyMTNSignature(req) {
  const secret = process.env.MTN_MOMO_API_KEY;
  const signature = req.headers['x-mtn-signature'];
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return signature === hash;
}

/**
 * Main webhook handler for Flutterwave
 */
async function handleFlutterwaveWebhook(req, res) {
  console.log('📥 Received Flutterwave webhook');
  
  // Verify signature
  if (!verifyFlutterwaveSignature(req)) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Invalid signature' 
    });
  }

  const payload = req.body;
  console.log('Webhook event:', payload.event);
  
  try {
    // Handle successful payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      await handleSuccessfulPayment(payload.data);
      return res.status(200).json({ status: 'success' });
    }
    
    // Handle failed payment
    if (payload.event === 'charge.completed' && payload.data.status === 'failed') {
      await handleFailedPayment(payload.data);
      return res.status(200).json({ status: 'success' });
    }
    
    // Handle other events
    console.log('Unhandled event type:', payload.event);
    return res.status(200).json({ status: 'received' });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Processing failed' 
    });
  }
}

/**
 * Process successful payment and activate subscription
 */
async function handleSuccessfulPayment(paymentData) {
  const {
    tx_ref,
    amount,
    currency,
    customer,
    meta,
    flw_ref,
    charged_amount
  } = paymentData;
  
  console.log(`✅ Processing successful payment: ${tx_ref}`);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Update transaction status
    const updateTxnQuery = `
      UPDATE transactions 
      SET 
        status = 'completed',
        completed_at = NOW(),
        provider_reference = $1,
        metadata = metadata || $2::jsonb
      WHERE transaction_id = $3
      RETURNING id, user_id, subscription_id, metadata
    `;
    
    const txnResult = await client.query(updateTxnQuery, [
      flw_ref,
      JSON.stringify({ 
        charged_amount,
        payment_completed_at: new Date().toISOString() 
      }),
      tx_ref
    ]);
    
    if (txnResult.rows.length === 0) {
      throw new Error(`Transaction not found: ${tx_ref}`);
    }
    
    const transaction = txnResult.rows[0];
    const userId = transaction.user_id;
    const planId = transaction.metadata?.plan_id;
    const isRenewal = transaction.metadata?.renewal || false;
    
    console.log(`User: ${userId}, Plan: ${planId}, Renewal: ${isRenewal}`);
    
    // 2. Get plan details
    const planQuery = `
      SELECT id, name, price, billing_cycle, features
      FROM subscription_plans
      WHERE id = $1
    `;
    const planResult = await client.query(planQuery, [planId]);
    
    if (planResult.rows.length === 0) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const plan = planResult.rows[0];
    
    // 3. Calculate subscription dates
    const startDate = new Date();
    let nextBillingDate;
    
    if (plan.billing_cycle === 'one-time') {
      // Voyager pass - valid for 30 days
      nextBillingDate = null;
    } else {
      // Monthly subscription - next billing in 30 days
      nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }
    
    // 4. Create or update subscription
    if (isRenewal && transaction.subscription_id) {
      // Update existing subscription
      const updateSubQuery = `
        UPDATE subscriptions
        SET 
          status = 'active',
          next_billing_date = $1,
          failed_attempts = 0,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      await client.query(updateSubQuery, [nextBillingDate, transaction.subscription_id]);
      console.log(`✅ Subscription renewed: ${transaction.subscription_id}`);
      
    } else {
      // Create new subscription
      const createSubQuery = `
        INSERT INTO subscriptions (
          user_id,
          plan_id,
          status,
          start_date,
          next_billing_date,
          payment_method,
          phone_number,
          billing_cycle,
          plan_features,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      
      const subResult = await client.query(createSubQuery, [
        userId,
        planId,
        'active',
        startDate,
        nextBillingDate,
        meta?.payment_method || 'mtn_momo',
        customer.phone_number,
        plan.billing_cycle,
        plan.features,
        JSON.stringify({
          activated_at: new Date().toISOString(),
          first_payment_ref: flw_ref
        })
      ]);
      
      const subscriptionId = subResult.rows[0].id;
      
      // Link transaction to subscription
      await client.query(
        'UPDATE transactions SET subscription_id = $1 WHERE id = $2',
        [subscriptionId, transaction.id]
      );
      
      console.log(`✅ New subscription created: ${subscriptionId}`);
    }
    
    // 5. Get user details for notifications
    const userQuery = `
      SELECT id, name, email, phone_number, fcm_token
      FROM users
      WHERE id = $1
    `;
    const userResult = await client.query(userQuery, [userId]);
    const user = userResult.rows[0];
    
    await client.query('COMMIT');
    
    // 6. Send notifications (async, don't block webhook response)
    setImmediate(async () => {
      try {
        // Send SMS
        const smsMessage = isRenewal
          ? `Your ${plan.name} subscription has been renewed! Next billing: ${nextBillingDate?.toLocaleDateString() || 'N/A'}. Thank you for choosing Sentinel Railways.`
          : `Welcome to ${plan.name}! Your subscription is now active. ${nextBillingDate ? `Next billing: ${nextBillingDate.toLocaleDateString()}` : 'Valid for 30 days'}. Book your journey now!`;
        
        await smsService.send(customer.phone_number, smsMessage);
        console.log('✅ SMS sent to', customer.phone_number);
        
        // Send push notification
        if (user.fcm_token) {
          await pushService.send(user.fcm_token, {
            title: isRenewal ? '🔄 Subscription Renewed' : '🎉 Subscription Active',
            body: `Your ${plan.name} is now active!`,
            data: {
              type: 'subscription_activated',
              plan_id: planId,
              subscription_id: transaction.subscription_id
            }
          });
          console.log('✅ Push notification sent');
        }
        
        // Send email (if available)
        if (user.email) {
          // TODO: Implement email service
          console.log('📧 Email notification queued for', user.email);
        }
        
      } catch (notificationError) {
        console.error('⚠️ Notification error:', notificationError);
        // Don't throw - notifications are non-critical
      }
    });
    
    console.log('✅ Payment processed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Payment processing error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(paymentData) {
  const { tx_ref, customer, meta } = paymentData;
  
  console.log(`❌ Processing failed payment: ${tx_ref}`);
  
  try {
    // Update transaction status
    await pool.query(
      `UPDATE transactions 
       SET status = 'failed', completed_at = NOW()
       WHERE transaction_id = $1`,
      [tx_ref]
    );
    
    // If this was a renewal, increment failed attempts
    if (meta?.renewal && meta?.subscription_id) {
      const result = await pool.query(
        `UPDATE subscriptions 
         SET 
           failed_attempts = failed_attempts + 1,
           status = CASE 
             WHEN failed_attempts >= 2 THEN 'suspended'
             ELSE 'payment_failed'
           END,
           updated_at = NOW()
         WHERE id = $1
         RETURNING failed_attempts, status`,
        [meta.subscription_id]
      );
      
      const subscription = result.rows[0];
      
      // Send notification
      const message = subscription.status === 'suspended'
        ? 'Your subscription has been suspended due to payment failure. Please update your payment method.'
        : 'Your subscription renewal payment failed. Please try again or update your payment method.';
      
      await smsService.send(customer.phone_number, message);
    }
    
    console.log('✅ Failed payment processed');
    
  } catch (error) {
    console.error('❌ Failed payment processing error:', error);
    throw error;
  }
}

/**
 * MTN MoMo webhook handler
 */
async function handleMTNWebhook(req, res) {
  console.log('📥 Received MTN MoMo webhook');
  
  if (!verifyMTNSignature(req)) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Invalid signature' 
    });
  }
  
  const payload = req.body;
  
  try {
    if (payload.status === 'SUCCESSFUL') {
      // Transform MTN payload to match our format
      const transformedData = {
        tx_ref: payload.externalId,
        amount: payload.amount,
        currency: payload.currency,
        customer: {
          phone_number: payload.payer.partyId
        },
        meta: payload.payerMessage ? JSON.parse(payload.payerMessage) : {},
        flw_ref: payload.financialTransactionId
      };
      
      await handleSuccessfulPayment(transformedData);
    }
    
    return res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('❌ MTN webhook error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Processing failed' 
    });
  }
}

/**
 * Airtel Money webhook handler
 */
async function handleAirtelWebhook(req, res) {
  console.log('📥 Received Airtel Money webhook');
  
  const payload = req.body;
  
  try {
    if (payload.transaction.status === 'SUCCESS') {
      const transformedData = {
        tx_ref: payload.transaction.id,
        amount: payload.transaction.amount,
        currency: payload.transaction.currency,
        customer: {
          phone_number: payload.transaction.msisdn
        },
        meta: payload.transaction.message ? JSON.parse(payload.transaction.message) : {},
        flw_ref: payload.transaction.airtel_money_id
      };
      
      await handleSuccessfulPayment(transformedData);
    }
    
    return res.status(200).json({ status: 'success' });
    
  } catch (error) {
    console.error('❌ Airtel webhook error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Processing failed' 
    });
  }
}

/**
 * Health check endpoint
 */
function healthCheck(req, res) {
  res.status(200).json({ 
    status: 'ok',
    service: 'subscription-webhook',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  handleFlutterwaveWebhook,
  handleMTNWebhook,
  handleAirtelWebhook,
  healthCheck
};
