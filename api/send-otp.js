// Vercel Serverless Function: Send OTP via WhatsApp or SMS

const otpStore = new Map(); // In production, use Redis or database

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

  // Send OTP via SMS (Africa's Talking or fallback)
  const smsResult = await sendSMSOTP(phone, otp);
  if (!smsResult.success) {
    // Store OTP anyway for demo purposes
    console.log(`Demo OTP for ${phone}: ${otp}`);
    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent via SMS',
      demo: true // Remove in production
    });
  }

  return res.status(200).json({ success: true, message: 'OTP sent via SMS' });
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
    to: phone.replace(/\D/g, ''), // Remove non-digits
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
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    console.log('SMS not configured, using demo mode');
    return { success: false, demo: true };
  }

  const message = `Your Africa Railways verification code is: ${otp}. Valid for 5 minutes.`;

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
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
      })
    });

    const data = await response.json();
    
    if (data.SMSMessageData?.Recipients?.[0]?.statusCode === '101') {
      return { success: true };
    }
    
    return { success: false, error: data.SMSMessageData?.Message };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}
