// Vercel Serverless Function: Verify OTP

// Pre-registered wallets (phone -> SUI wallet address)
// These are existing wallets with AFC tokens
const REGISTERED_WALLETS = {
  '+260975190740': '0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8', // Benjamin Mpolokoso
  '+260966165444': '0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8', // Master Visionary
};

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

  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone and code are required' });
  }

  // Get OTP from global store
  global.otpStore = global.otpStore || new Map();
  const entry = global.otpStore.get(phone);

  // Demo mode: accept any 6-digit code if no OTP stored (for testing)
  if (!entry) {
    if (code.length === 6 && /^\d+$/.test(code)) {
      const wallet = getWalletForPhone(phone);
      return res.status(200).json({
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
    global.otpStore.delete(phone);
    return res.status(401).json({ 
      success: false, 
      error: 'OTP has expired. Please request a new code.' 
    });
  }

  // Check attempts
  entry.attempts = (entry.attempts || 0) + 1;
  if (entry.attempts > 3) {
    global.otpStore.delete(phone);
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

  // Success - remove OTP and get/generate wallet
  global.otpStore.delete(phone);
  
  // Check for pre-registered wallet first
  const wallet = getWalletForPhone(phone);

  return res.status(200).json({
    success: true,
    message: 'Phone verified successfully',
    wallet: wallet
  });
}

function getWalletForPhone(phone) {
  // Normalize phone number for lookup
  const normalized = phone.replace(/\s/g, '');
  
  // Check pre-registered wallets
  if (REGISTERED_WALLETS[normalized]) {
    return REGISTERED_WALLETS[normalized];
  }
  
  // Also check without + prefix
  const withPlus = normalized.startsWith('+') ? normalized : '+' + normalized;
  const withoutPlus = normalized.startsWith('+') ? normalized.slice(1) : normalized;
  
  if (REGISTERED_WALLETS[withPlus]) {
    return REGISTERED_WALLETS[withPlus];
  }
  if (REGISTERED_WALLETS[withoutPlus]) {
    return REGISTERED_WALLETS[withoutPlus];
  }
  
  // Generate new wallet if not registered
  return generateWalletFromPhone(phone);
}

function generateWalletFromPhone(phone) {
  // Deterministic wallet generation from phone number
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
