// Local development server with API endpoints
// For production, deploy to Vercel which handles /api/* routes automatically

import express from 'express';
import helmet from 'helmet';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// Request size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Controlled CORS
app.use((req, res, next) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Rate limiting
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const window = now - windowMs;
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }
  
  const requests = rateLimitStore.get(identifier).filter(t => t > window);
  
  if (requests.length >= maxRequests) {
    return false;
  }
  
  requests.push(now);
  rateLimitStore.set(identifier, requests);
  return true;
}

// OTP Storage (in-memory for development)
const otpStore = new Map();

// Input validation
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

function validateOTPCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 50 && num < 1000000;
}

// API: Send OTP
app.post('/api/send-otp', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 3, 60000)) {
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }

    const { phone, method } = req.body;

    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(phone, { otp, expiresAt, attempts: 0 });

    console.log(`Generated OTP for ${phone.slice(-4)}`);

    // Try to send via SMS providers
    if (method === 'whatsapp') {
      // WhatsApp not configured for local dev
      console.log(`[DEMO] WhatsApp OTP for ${phone.slice(-4)}`);
      return res.json({ success: true, message: 'OTP sent via WhatsApp', demo: true });
    }

    // Try Africa's Talking first
    const atResult = await sendAfricasTalkingSMS(phone, otp);
    if (atResult.success) {
      return res.json({ 
        success: true, 
        message: 'OTP sent via SMS (Africa\'s Talking)',
        provider: 'africastalking'
      });
    }

    console.log('Africa\'s Talking failed:', atResult.error);

    // Fallback to Twilio
    const twilioResult = await sendTwilioSMS(phone, otp);
    if (twilioResult.success) {
      return res.json({ 
        success: true, 
        message: 'OTP sent via SMS (Twilio)',
        provider: 'twilio'
      });
    }

    console.log('Twilio failed:', twilioResult.error);

    // Both failed - return demo mode
    console.log(`[DEMO] SMS OTP for ${phone.slice(-4)}`);
    return res.json({ 
      success: true, 
      message: 'OTP sent via SMS',
      demo: true
    });
  } catch (error) {
    console.error('OTP send error:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// API: Verify OTP
app.post('/api/verify-otp', (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 5, 60000)) {
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }

    const { phone, code } = req.body;

    if (!phone || !validatePhoneNumber(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number' });
    }

    if (!code || !validateOTPCode(code)) {
      return res.status(400).json({ success: false, error: 'Invalid OTP code format' });
    }

    const entry = otpStore.get(phone);

    // Demo mode: accept any 6-digit code if no OTP stored
    if (!entry) {
      if (validateOTPCode(code)) {
        const wallet = generateWalletFromPhone(phone);
        return res.json({
          success: true,
          message: 'Phone verified (demo mode)',
          wallet: wallet,
          demo: true
        });
      }
      return res.status(401).json({ 
        success: false, 
        error: 'No OTP found. Please request a new code.' 
      });
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(401).json({ 
        success: false, 
        error: 'OTP has expired. Please request a new code.' 
      });
    }

    // Check attempts
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts > 3) {
      otpStore.delete(phone);
      return res.status(429).json({ 
        success: false, 
        error: 'Too many attempts. Please request a new code.' 
      });
    }

    // Verify OTP
    if (entry.otp !== code) {
      const remaining = 3 - entry.attempts;
      return res.status(401).json({ 
        success: false, 
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      });
    }

    // Success
    otpStore.delete(phone);
    const wallet = generateWalletFromPhone(phone);

    return res.json({
      success: true,
      message: 'Phone verified successfully',
      wallet: wallet
    });
  } catch (error) {
    console.error('OTP verify error:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// API: Stripe Payment Intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.log('[DEMO] Stripe not configured - using demo mode');
      const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';
      const successUrl = `${origin}/zambia-railways.html?payment=success&demo=true`;
      return res.json({
        url: successUrl,
        demo: true,
        message: 'Demo mode - Stripe not configured'
      });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!validateAmount(amount)) {
      return res.status(400).json({ error: 'Amount must be between 50 cents and 10,000' });
    }

    if (typeof currency !== 'string' || currency.length !== 3) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Sanitize metadata
    const sanitizedMetadata = {};
    for (const [key, value] of Object.entries(metadata || {})) {
      if (typeof key === 'string' && key.length < 100 && typeof value === 'string' && value.length < 500) {
        sanitizedMetadata[key] = value;
      }
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);
    
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://africarailways.com';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Train Ticket: ${sanitizedMetadata.from || 'Origin'} → ${sanitizedMetadata.to || 'Destination'}`,
              description: `${sanitizedMetadata.date || 'Travel Date'} | ${sanitizedMetadata.passengers || 1} passenger(s)`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/zambia-railways.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/zambia-railways.html?payment=cancelled`,
      metadata: {
        ...sanitizedMetadata,
        source: 'africa-railways',
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Helper: Generate wallet from phone
function generateWalletFromPhone(phone) {
  const digits = phone.replace(/\D/g, '').slice(-10).padStart(10, '0');
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    const digitIdx = i % 10;
    const digit = parseInt(digits[digitIdx]);
    const hexChar = ((digit * (i + 1)) % 16).toString(16);
    address += hexChar;
  }
  return address;
}

// Helper: Send SMS via Africa's Talking
async function sendAfricasTalkingSMS(phone, otp) {
  const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AT_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || process.env.AT_USERNAME || 'africarailways';
  
  if (!apiKey) {
    return { success: false, error: 'API key not configured' };
  }

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
      })
    });

    const data = await response.json();
    
    const recipient = data.SMSMessageData?.Recipients?.[0];
    if (recipient?.statusCode === '101' || recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }
    
    return { success: false, error: data.SMSMessageData?.Message || 'Unknown error' };
  } catch (error) {
    console.error('Africa\'s Talking error:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper: Send SMS via Twilio
async function sendTwilioSMS(phone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio not configured' };
  }

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
      })
    });

    const data = await response.json();
    
    if (data.sid && !data.error_code) {
      return { success: true, messageId: data.sid };
    }
    
    return { success: false, error: data.message || data.error_message || 'Unknown error' };
  } catch (error) {
    console.error('Twilio error:', error.message);
    return { success: false, error: error.message };
  }
}

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for SPA routes
app.get('/{*path}', (req, res) => {
  // Check if it's an HTML file request
  if (req.path.endsWith('.html') || !req.path.includes('.')) {
    const htmlPath = req.path.endsWith('.html') 
      ? path.join(__dirname, req.path)
      : path.join(__dirname, 'index.html');
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Not found');
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚂 Africa Railways server running on port ${PORT}`);
  console.log(`   Open: http://localhost:${PORT}`);
  console.log('');
  console.log('   SMS Providers:');
  console.log('   - Africa\'s Talking (primary)');
  console.log('   - Twilio (fallback)');
});

  
  // Store OTP with expiry (5 minutes)
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(phone, { otp, expiresAt, attempts: 0 });

  console.log(`Generated OTP for ${phone}: ${otp}`);

  // Try to send via SMS providers
  if (method === 'whatsapp') {
    // WhatsApp not configured for local dev
    console.log(`[DEMO] WhatsApp OTP for ${phone}: ${otp}`);
    return res.json({ success: true, message: 'OTP sent via WhatsApp', demo: true });
  }

  // Try Africa's Talking first
  const atResult = await sendAfricasTalkingSMS(phone, otp);
  if (atResult.success) {
    return res.json({ 
      success: true, 
      message: 'OTP sent via SMS (Africa\'s Talking)',
      provider: 'africastalking'
    });
  }

  console.log('Africa\'s Talking failed:', atResult.error);

  // Fallback to Twilio
  const twilioResult = await sendTwilioSMS(phone, otp);
  if (twilioResult.success) {
    return res.json({ 
      success: true, 
      message: 'OTP sent via SMS (Twilio)',
      provider: 'twilio'
    });
  }

  console.log('Twilio failed:', twilioResult.error);

  // Both failed - return demo mode
  console.log(`[DEMO] SMS OTP for ${phone}: ${otp}`);
  return res.json({ 
    success: true, 
    message: 'OTP sent via SMS',
    demo: true,
    // Include OTP in dev mode for testing
    _devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
  });
});

// API: Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone and code are required' });
  }

  const entry = otpStore.get(phone);

  // Demo mode: accept any 6-digit code if no OTP stored
  if (!entry) {
    if (code.length === 6 && /^\d+$/.test(code)) {
      const wallet = generateWalletFromPhone(phone);
      return res.json({
        success: true,
        message: 'Phone verified (demo mode)',
        wallet: wallet,
        demo: true
      });
    }
    return res.status(401).json({ 
      success: false, 
      error: 'No OTP found. Please request a new code.' 
    });
  }

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return res.status(401).json({ 
      success: false, 
      error: 'OTP has expired. Please request a new code.' 
    });
  }

  // Check attempts
  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts > 3) {
    otpStore.delete(phone);
    return res.status(401).json({ 
      success: false, 
      error: 'Too many attempts. Please request a new code.' 
    });
  }

  // Verify OTP
  if (entry.otp !== code) {
    const remaining = 3 - entry.attempts;
    return res.status(401).json({ 
      success: false, 
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
    });
  }

  // Success
  otpStore.delete(phone);
  const wallet = generateWalletFromPhone(phone);

  return res.json({
    success: true,
    message: 'Phone verified successfully',
    wallet: wallet
  });
});

// API: Stripe Payment Intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.log('[DEMO] Stripe not configured - using demo mode');
    // Return a demo checkout URL for testing
    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';
    const successUrl = `${origin}/zambia-railways.html?payment=success&demo=true`;
    return res.json({
      url: successUrl,
      demo: true,
      message: 'Demo mode - Stripe not configured'
    });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);
    
    const { amount, currency = 'usd', metadata = {} } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least 50 cents' });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://africarailways.com';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Train Ticket: ${metadata.from || 'Origin'} → ${metadata.to || 'Destination'}`,
              description: `${metadata.date || 'Travel Date'} | ${metadata.passengers || 1} passenger(s) | ${metadata.railway || 'ZRL'}`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/zambia-railways.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/zambia-railways.html?payment=cancelled`,
      metadata: {
        ...metadata,
        source: 'africa-railways',
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Generate wallet from phone
function generateWalletFromPhone(phone) {
  const digits = phone.replace(/\D/g, '').slice(-10).padStart(10, '0');
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    const digitIdx = i % 10;
    const digit = parseInt(digits[digitIdx]);
    const hexChar = ((digit * (i + 1)) % 16).toString(16);
    address += hexChar;
  }
  return address;
}

// Helper: Send SMS via Africa's Talking
async function sendAfricasTalkingSMS(phone, otp) {
  const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AT_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME || process.env.AT_USERNAME || 'africarailways';
  
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
      })
    });

    const data = await response.json();
    console.log('Africa\'s Talking response:', JSON.stringify(data));
    
    const recipient = data.SMSMessageData?.Recipients?.[0];
    if (recipient?.statusCode === '101' || recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }
    
    return { success: false, error: data.SMSMessageData?.Message || 'Unknown error' };
  } catch (error) {
    console.error('Africa\'s Talking error:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Send SMS via Twilio
async function sendTwilioSMS(phone, otp) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
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
      })
    });

    const data = await response.json();
    console.log('Twilio response:', JSON.stringify(data));
    
    if (data.sid && !data.error_code) {
      return { success: true, messageId: data.sid };
    }
    
    return { success: false, error: data.message || data.error_message || 'Unknown error' };
  } catch (error) {
    console.error('Twilio error:', error);
    return { success: false, error: error.message };
  }
}

// Serve static files
app.use(express.static(__dirname));

// Fallback to index.html for SPA routes
app.get('/{*path}', (req, res) => {
  // Check if it's an HTML file request
  if (req.path.endsWith('.html') || !req.path.includes('.')) {
    const htmlPath = req.path.endsWith('.html') 
      ? path.join(__dirname, req.path)
      : path.join(__dirname, 'index.html');
    res.sendFile(htmlPath);
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, () => {
  console.log(`🚂 Africa Railways server running on port ${PORT}`);
  console.log(`   Open: http://localhost:${PORT}`);
  console.log('');
  console.log('   SMS Providers:');
  console.log('   - Africa\'s Talking (primary)');
  console.log('   - Twilio (fallback)');
});
