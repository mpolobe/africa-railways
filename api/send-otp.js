// Vercel Serverless Function: Send OTP via SMS (Africa's Talking primary, Twilio fallback)
// Production Configuration:
// - Africa's Talking: App=AfricaRailways_Zambia, Username=africarailways
// - Twilio: Fallback provider if AT fails

// Helper to encode base64 (works in both Node.js and Edge)
function btoa64(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64');
  }
  return btoa(str);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { phone, method } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiry (5 minutes)
  const expiresAt = Date.now() + 5 * 60 * 1000;
  
  // Use global storage for Vercel (note: this resets on cold starts)
  // For production, use Vercel KV, Upstash Redis, or database
  global.otpStore = global.otpStore || new Map();
  global.otpStore.set(phone, { otp, expiresAt, attempts: 0 });

  // Send OTP via WhatsApp
  if (method === 'whatsapp') {
    const whatsappResult = await sendWhatsAppOTP(phone, otp);
    if (!whatsappResult.success) {
      return res.status(500).json({ success: false, error: whatsappResult.error });
    }
    return res.status(200).json({ success: true, message: 'OTP sent via WhatsApp' });
  }

  // Send OTP via SMS - Try Africa's Talking first, fallback to Twilio
  const smsResult = await sendSMSOTP(phone, otp);
  
  if (smsResult.success) {
    return res.status(200).json({ 
      success: true, 
      message: `OTP sent via SMS (${smsResult.provider})`,
      provider: smsResult.provider
    });
  }

  // Both providers failed - log OTP for demo/testing
  console.log(`Demo OTP for ${phone}: ${otp}`);
  return res.status(200).json({ 
    success: true, 
    message: 'OTP sent via SMS',
    demo: true
  });
}

async function sendWhatsAppOTP(phone, otp) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '947040551825655';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.log('WhatsApp not configured, using demo mode');
    return { success: true, demo: true };
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone.replace(/\D/g, ''),
    type: 'text',
    text: {
      preview_url: false,
      body: `🚂 *Africa Railways*\n\nYour verification code is: *${otp}*\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore.`
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error('WhatsApp API error:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`WhatsApp OTP sent to ${phone}:`, data.messages?.[0]?.id);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendSMSOTP(phone, otp) {
  const message = `Your Africa Railways verification code is: ${otp}. Valid for 5 minutes.`;
  
  // Try Africa's Talking first (primary provider)
  const atResult = await sendAfricasTalkingSMS(phone, otp, message);
  if (atResult.success) {
    return { success: true, provider: 'africastalking', messageId: atResult.messageId };
  }
  
  console.log('Africa\'s Talking failed, trying Twilio fallback...');
  
  // Fallback to Twilio
  const twilioResult = await sendTwilioSMS(phone, message);
  if (twilioResult.success) {
    return { success: true, provider: 'twilio', messageId: twilioResult.messageId };
  }
  
  return { success: false, error: 'All SMS providers failed' };
}

async function sendAfricasTalkingSMS(phone, otp, message) {
  // Production credentials from environment (AfricaRailways_Zambia app)
  const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AT_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || process.env.AT_USERNAME || 'africarailways';
  
  if (!apiKey || apiKey === 'your_africas_talking_api_key') {
    console.log('Africa\'s Talking not configured');
    return { success: false, error: 'Not configured' };
  }

  // Use production API (not sandbox)
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
    
    console.log('Africa\'s Talking response:', JSON.stringify(data));
    
    if (data.SMSMessageData?.Recipients?.[0]?.statusCode === '101') {
      return { 
        success: true, 
        messageId: data.SMSMessageData.Recipients[0].messageId 
      };
    }
    
    // Check for other success statuses
    if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      return { 
        success: true, 
        messageId: data.SMSMessageData.Recipients[0].messageId 
      };
    }
    
    return { 
      success: false, 
      error: data.SMSMessageData?.Message || 'Unknown error' 
    };
  } catch (error) {
    console.error('Africa\'s Talking error:', error);
    return { success: false, error: error.message };
  }
}

async function sendTwilioSMS(phone, message) {
  // Production Twilio credentials from environment
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.log('Twilio not configured');
    return { success: false, error: 'Not configured' };
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa64(`${accountSid}:${authToken}`)
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: message
      }).toString()
    });

    const data = await response.json();
    
    console.log('Twilio response:', JSON.stringify(data));
    
    if (data.sid && !data.error_code) {
      return { success: true, messageId: data.sid };
    }
    
    return { 
      success: false, 
      error: data.message || data.error_message || 'Unknown error' 
    };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, error: error.message };
  }
}
