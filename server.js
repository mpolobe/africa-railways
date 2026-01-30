// Local development server with API endpoints
// For production, deploy to Vercel which handles /api/* routes automatically

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// OTP Storage (in-memory for development)
const otpStore = new Map();

// API: Send OTP
app.post('/api/send-otp', async (req, res) => {
  const { phone, method } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
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

// AI Chat endpoint
const AI_SYSTEM_PROMPT = `You are the Africa Railways AI Assistant, a helpful and knowledgeable guide for the Africa Railways platform.

You help users with:
- Booking train tickets across African railway networks (TAZARA, Zambia Railways, PRASA, Kenya Railways)
- Understanding ticket classes (First Class, Second Class, Economy)
- Tracking their journeys and checking train schedules
- Managing their digital wallet (AFC tokens, SENT tokens, AFRC tokens)
- Understanding NFT ticket souvenirs and how to collect them
- Navigating the dashboard and platform features
- General questions about African railways and travel tips

Key information:
- AFC (Africa Coin) is on the SUI blockchain - addresses are auto-generated
- SENT and AFRC tokens are on Polygon and require manual wallet connection
- Users can book tickets, view their journey history, and collect NFT souvenirs
- The platform supports phone login (OTP), Google, and Facebook authentication

Be friendly, concise, and helpful. If you don't know something specific about a user's account, guide them to the appropriate section of the dashboard or suggest contacting support.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }
  
  try {
    // Convert messages to OpenAI format
    const openaiMessages = [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role,
        content: m.parts ? m.parts.map(p => p.text).join('') : m.content
      }))
    ];
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        stream: true
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      return res.status(500).json({ error: 'AI service error' });
    }
    
    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ type: 'text-delta', delta })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
