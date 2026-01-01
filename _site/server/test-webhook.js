/**
 * Test script for webhook server
 * 
 * Usage:
 *   node test-webhook.js
 */

const http = require('http');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000';
const SECRET_HASH = process.env.PAYMENT_SECRET_HASH || 'test_secret_hash';

// Test data
const testPayload = {
  event: 'charge.completed',
  data: {
    status: 'successful',
    tx_ref: `test_${Date.now()}`,
    amount: 50,
    currency: 'ZMW',
    customer: {
      phone_number: '+260977123456',
      email: 'test@example.com',
      name: 'Test User'
    },
    meta: {
      user_id: 'test_user_123',
      plan_id: 'sentinel_trader',
      subscription: true
    },
    flw_ref: `FLW_${Date.now()}`,
    charged_amount: 50
  }
};

function sendTestWebhook() {
  const data = JSON.stringify(testPayload);
  
  const options = {
    hostname: new URL(WEBHOOK_URL).hostname,
    port: new URL(WEBHOOK_URL).port || 80,
    path: '/api/webhooks/sentinel-pay',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'verif-hash': SECRET_HASH
    }
  };
  
  console.log('🧪 Sending test webhook...');
  console.log('URL:', `${WEBHOOK_URL}/api/webhooks/sentinel-pay`);
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('\n✅ Response received:');
      console.log('Status:', res.statusCode);
      console.log('Body:', responseData);
      
      if (res.statusCode === 200) {
        console.log('\n✅ Test webhook successful!');
      } else {
        console.log('\n❌ Test webhook failed!');
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error sending webhook:', error.message);
  });
  
  req.write(data);
  req.end();
}

// Run test
sendTestWebhook();
