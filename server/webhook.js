/**
 * Sentinel Payment Webhook Server
 * 
 * Handles real-time payment confirmations from:
 * - Flutterwave (MTN, Airtel, Zamtel)
 * - MTN MoMo Direct API
 * - Airtel Money Direct API
 * 
 * Automatically activates subscriptions when users enter PIN on their phone
 */

const express = require('express');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, verif-hash, x-mtn-signature');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuration
const SECRET_HASH = process.env.PAYMENT_SECRET_HASH || process.env.FLW_SECRET_HASH;
const MTN_API_KEY = process.env.MTN_MOMO_API_KEY;
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET;

// SMS Configuration (using existing Africa's Talking or Twilio)
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'africas_talking',
  apiKey: process.env.VITE_AFRICAS_TALKING_API_KEY || process.env.AT_API_KEY,
  username: process.env.VITE_AFRICAS_TALKING_USERNAME || process.env.AT_USERNAME,
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhone: process.env.TWILIO_PHONE_NUMBER
};

/**
 * Logging utility
 */
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  
  if (level === 'error') {
    console.error('❌', JSON.stringify(logEntry, null, 2));
  } else if (level === 'success') {
    console.log('✅', JSON.stringify(logEntry, null, 2));
  } else {
    console.log('📝', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Send SMS notification
 */
async function sendSMS(phoneNumber, message) {
  try {
    if (SMS_CONFIG.provider === 'africas_talking') {
      // Africa's Talking implementation
      const AfricasTalking = require('africastalking');
      const africastalking = AfricasTalking({
        apiKey: SMS_CONFIG.apiKey,
        username: SMS_CONFIG.username
      });
      
      const result = await africastalking.SMS.send({
        to: [phoneNumber],
        message: message,
        from: 'Sentinel'
      });
      
      log('success', 'SMS sent via Africa\'s Talking', { phoneNumber, result });
      return result;
      
    } else if (SMS_CONFIG.provider === 'twilio') {
      // Twilio implementation
      const twilio = require('twilio');
      const client = twilio(SMS_CONFIG.twilioSid, SMS_CONFIG.twilioToken);
      
      const result = await client.messages.create({
        body: message,
        from: SMS_CONFIG.twilioPhone,
        to: phoneNumber
      });
      
      log('success', 'SMS sent via Twilio', { phoneNumber, sid: result.sid });
      return result;
    }
  } catch (error) {
    log('error', 'SMS sending failed', { phoneNumber, error: error.message });
    // Don't throw - SMS is non-critical
  }
}

/**
 * Activate subscription in database
 */
async function activateSubscription(phoneNumber, txRef, amount, planId, userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    log('info', 'Activating subscription', { phoneNumber, txRef, amount, planId, userId });
    
    // 1. Get plan details
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
    
    // 2. Calculate dates
    const startDate = new Date();
    let nextBillingDate = null;
    
    if (plan.billing_cycle === 'monthly') {
      nextBillingDate = new Date(startDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    }
    
    // 3. Check if subscription already exists
    const existingSubQuery = `
      SELECT id, status FROM subscriptions
      WHERE user_id = $1 AND plan_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const existingSub = await client.query(existingSubQuery, [userId, planId]);
    
    let subscriptionId;
    
    if (existingSub.rows.length > 0 && existingSub.rows[0].status === 'active') {
      // Extend existing subscription
      subscriptionId = existingSub.rows[0].id;
      
      await client.query(`
        UPDATE subscriptions
        SET 
          next_billing_date = CASE 
            WHEN next_billing_date > NOW() THEN next_billing_date + INTERVAL '30 days'
            ELSE NOW() + INTERVAL '30 days'
          END,
          updated_at = NOW()
        WHERE id = $1
      `, [subscriptionId]);
      
      log('success', 'Subscription extended', { subscriptionId });
      
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
        'mobile_money',
        phoneNumber,
        plan.billing_cycle,
        plan.features,
        JSON.stringify({
          activated_at: new Date().toISOString(),
          activation_tx_ref: txRef
        })
      ]);
      
      subscriptionId = subResult.rows[0].id;
      log('success', 'New subscription created', { subscriptionId });
    }
    
    // 4. Update transaction record
    await client.query(`
      UPDATE transactions
      SET 
        status = 'completed',
        subscription_id = $1,
        completed_at = NOW()
      WHERE transaction_id = $2
    `, [subscriptionId, txRef]);
    
    // 5. Record usage event
    await client.query(`
      INSERT INTO subscription_usage (
        subscription_id,
        user_id,
        usage_type,
        metadata
      ) VALUES ($1, $2, 'subscription_activated', $3)
    `, [
      subscriptionId,
      userId,
      JSON.stringify({ tx_ref: txRef, amount })
    ]);
    
    await client.query('COMMIT');
    
    // 6. Send SMS notification
    const smsMessage = `✅ Welcome to ${plan.name}! Your subscription is now active. ${
      nextBillingDate 
        ? `Next billing: ${nextBillingDate.toLocaleDateString('en-GB')}.` 
        : 'Valid for 30 days.'
    } Start booking now! - Sentinel Railways`;
    
    await sendSMS(phoneNumber, smsMessage);
    
    log('success', 'Subscription activated successfully', {
      subscriptionId,
      userId,
      planId,
      phoneNumber
    });
    
    return { subscriptionId, plan };
    
  } catch (error) {
    await client.query('ROLLBACK');
    log('error', 'Subscription activation failed', { 
      phoneNumber, 
      txRef, 
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main webhook endpoint for Flutterwave/Mobile Money
 */
app.post('/api/webhooks/sentinel-pay', async (req, res) => {
  log('info', 'Webhook received', { 
    headers: req.headers,
    body: req.body 
  });
  
  // 1. Verify the signature (Security first!)
  const signature = req.headers['verif-hash'];
  if (!signature || signature !== SECRET_HASH) {
    log('error', 'Invalid webhook signature', { 
      received: signature,
      expected: SECRET_HASH ? 'SET' : 'NOT_SET'
    });
    return res.status(401).json({ 
      status: 'error',
      message: 'Invalid signature' 
    });
  }

  const payload = req.body;
  
  // Handle different webhook events
  if (payload.event === 'charge.completed') {
    const { status, tx_ref, customer, amount, currency, meta } = payload.data;

    // 2. Only process successful payments
    if (status === 'successful') {
      log('success', 'Payment received', {
        phoneNumber: customer.phone_number,
        amount,
        currency,
        txRef: tx_ref
      });

      try {
        // Extract metadata
        const userId = meta?.user_id;
        const planId = meta?.plan_id;
        
        if (!userId || !planId) {
          throw new Error('Missing user_id or plan_id in payment metadata');
        }
        
        // 3. Activate subscription in database
        const result = await activateSubscription(
          customer.phone_number,
          tx_ref,
          amount,
          planId,
          userId
        );
        
        // 4. Return 200 to tell the gateway we received it
        return res.status(200).json({ 
          status: 'success', 
          message: 'Subscription Activated',
          subscription_id: result.subscriptionId,
          plan_name: result.plan.name
        });
        
      } catch (error) {
        log('error', 'Activation error', { 
          txRef: tx_ref,
          error: error.message 
        });
        
        // Still return 200 to prevent retries, but log the error
        return res.status(200).json({ 
          status: 'error', 
          message: 'Activation failed - will retry',
          error: error.message
        });
      }
    }
    
    // Handle failed payments
    if (status === 'failed') {
      log('error', 'Payment failed', {
        phoneNumber: customer.phone_number,
        txRef: tx_ref,
        amount
      });
      
      // Update transaction status
      try {
        await pool.query(`
          UPDATE transactions
          SET status = 'failed', completed_at = NOW()
          WHERE transaction_id = $1
        `, [tx_ref]);
        
        // Send failure SMS
        await sendSMS(
          customer.phone_number,
          '❌ Payment failed. Please try again or contact support. - Sentinel Railways'
        );
      } catch (error) {
        log('error', 'Failed payment processing error', { error: error.message });
      }
      
      return res.status(200).json({ 
        status: 'received', 
        message: 'Payment failed - user notified' 
      });
    }
  }

  // Other events
  log('info', 'Unhandled webhook event', { event: payload.event });
  res.status(200).json({ status: 'received' });
});

/**
 * MTN MoMo Direct webhook
 */
app.post('/api/webhooks/mtn-momo', async (req, res) => {
  log('info', 'MTN MoMo webhook received', { body: req.body });
  
  // Verify MTN signature
  const signature = req.headers['x-mtn-signature'];
  const hash = crypto
    .createHmac('sha256', MTN_API_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== hash) {
    log('error', 'Invalid MTN signature');
    return res.status(401).json({ status: 'error', message: 'Invalid signature' });
  }
  
  const { status, externalId, amount, payer } = req.body;
  
  if (status === 'SUCCESSFUL') {
    try {
      // Parse metadata from externalId or payerMessage
      const metadata = JSON.parse(req.body.payerMessage || '{}');
      
      await activateSubscription(
        payer.partyId,
        externalId,
        amount,
        metadata.plan_id,
        metadata.user_id
      );
      
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      log('error', 'MTN webhook processing error', { error: error.message });
      return res.status(200).json({ status: 'error', message: error.message });
    }
  }
  
  res.status(200).json({ status: 'received' });
});

/**
 * Airtel Money webhook
 */
app.post('/api/webhooks/airtel-money', async (req, res) => {
  log('info', 'Airtel Money webhook received', { body: req.body });
  
  const { transaction } = req.body;
  
  if (transaction.status === 'SUCCESS') {
    try {
      const metadata = JSON.parse(transaction.message || '{}');
      
      await activateSubscription(
        transaction.msisdn,
        transaction.id,
        transaction.amount,
        metadata.plan_id,
        metadata.user_id
      );
      
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      log('error', 'Airtel webhook processing error', { error: error.message });
      return res.status(200).json({ status: 'error', message: error.message });
    }
  }
  
  res.status(200).json({ status: 'received' });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'sentinel-webhook-server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Test endpoint (development only)
 */
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/webhooks/test', async (req, res) => {
    log('info', 'Test webhook triggered', { body: req.body });
    
    try {
      const { phone_number, plan_id, user_id, amount } = req.body;
      
      const result = await activateSubscription(
        phone_number,
        `test_${Date.now()}`,
        amount || 50,
        plan_id || 'sentinel_trader',
        user_id
      );
      
      res.status(200).json({ 
        status: 'success',
        message: 'Test subscription activated',
        result
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        message: error.message 
      });
    }
  });
}

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  log('error', 'Unhandled error', { 
    error: err.message,
    stack: err.stack,
    url: req.url
  });
  
  res.status(500).json({ 
    status: 'error',
    message: 'Internal server error' 
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  log('success', `Sentinel Webhook Server started`, { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
    sms_provider: SMS_CONFIG.provider
  });
  
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚂 SENTINEL WEBHOOK SERVER                         ║
║                                                       ║
║   Status: RUNNING                                     ║
║   Port: ${PORT}                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                       ║
║   Endpoints:                                          ║
║   POST /api/webhooks/sentinel-pay                    ║
║   POST /api/webhooks/mtn-momo                        ║
║   POST /api/webhooks/airtel-money                    ║
║   GET  /health                                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  pool.end(() => {
    log('info', 'Database pool closed');
    process.exit(0);
  });
});

module.exports = app;
