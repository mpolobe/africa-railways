#!/usr/bin/env node
// Test OTP sending via Africa's Talking and Twilio
// Usage: node scripts/test-otp.js +260966165444

import 'dotenv/config';

const phone = process.argv[2] || '+260966165444';
const otp = Math.floor(100000 + Math.random() * 900000).toString();

console.log('🧪 OTP Test Script');
console.log('==================');
console.log(`Phone: ${phone}`);
console.log(`OTP: ${otp}`);
console.log('');

// Test Africa's Talking
async function testAfricasTalking() {
  console.log('📱 Testing Africa\'s Talking...');
  
  const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AT_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || process.env.AT_USERNAME || 'africarailways';
  
  if (!apiKey) {
    console.log('❌ AFRICASTALKING_API_KEY not set');
    return { success: false, error: 'API key not configured' };
  }
  
  console.log(`   Username: ${username}`);
  console.log(`   API Key: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`);
  
  const message = `Your Africa Railways verification code is: ${otp}. Valid for 5 minutes.`;
  const apiUrl = 'https://api.africastalking.com/version1/messaging';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        username: username,
        to: phone,
        message: message
      }).toString()
    });

    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    const recipient = data.SMSMessageData?.Recipients?.[0];
    const statusCode = recipient?.statusCode;
    // Status codes: 100 = Sent, 101 = Sent (to mobile), 102 = Queued
    if (statusCode === '100' || statusCode === '101' || statusCode === '102' || statusCode === 100 || statusCode === 101 || statusCode === 102 || recipient?.status === 'Success') {
      console.log('✅ Africa\'s Talking: SUCCESS');
      return { success: true, messageId: recipient.messageId };
    }
    
    console.log('❌ Africa\'s Talking: FAILED');
    return { success: false, error: data.SMSMessageData?.Message || 'Unknown error' };
  } catch (error) {
    console.log('❌ Africa\'s Talking: ERROR -', error.message);
    return { success: false, error: error.message };
  }
}

// Test Twilio
async function testTwilio() {
  console.log('\n📱 Testing Twilio...');
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.log('❌ Twilio credentials not set');
    console.log(`   TWILIO_ACCOUNT_SID: ${accountSid ? 'set' : 'missing'}`);
    console.log(`   TWILIO_AUTH_TOKEN: ${authToken ? 'set' : 'missing'}`);
    console.log(`   TWILIO_PHONE_NUMBER: ${fromNumber || 'missing'}`);
    return { success: false, error: 'Credentials not configured' };
  }
  
  console.log(`   Account SID: ${accountSid.slice(0, 6)}...${accountSid.slice(-4)}`);
  console.log(`   From Number: ${fromNumber}`);
  
  const message = `Your Africa Railways verification code is: ${otp}. Valid for 5 minutes.`;
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: message
      }).toString()
    });

    const data = await response.json();
    console.log('   Response:', JSON.stringify(data, null, 2));
    
    if (data.sid && !data.error_code) {
      console.log('✅ Twilio: SUCCESS');
      return { success: true, messageId: data.sid };
    }
    
    console.log('❌ Twilio: FAILED');
    return { success: false, error: data.message || data.error_message || 'Unknown error' };
  } catch (error) {
    console.log('❌ Twilio: ERROR -', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests
async function main() {
  console.log('Environment variables loaded from .env\n');
  
  const atResult = await testAfricasTalking();
  
  if (!atResult.success) {
    const twilioResult = await testTwilio();
    
    if (!twilioResult.success) {
      console.log('\n❌ Both providers failed!');
      process.exit(1);
    }
  }
  
  console.log('\n✅ OTP sent successfully!');
  console.log(`   Use code: ${otp}`);
}

main().catch(console.error);
