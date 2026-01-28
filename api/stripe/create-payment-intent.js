// Stripe Payment Intent API for Africa Railways
// Handles card payments for train ticket bookings

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    return res.status(500).json({ 
      error: 'Payment service not configured',
      debug: {
        hasKey: false,
        env: Object.keys(process.env).filter(k => k.includes('STRIPE')).join(', ') || 'none'
      }
    });
  }

  // Log key type for debugging (safe - only shows prefix)
  const keyType = stripeSecretKey.startsWith('sk_live_') ? 'live' : 
                  stripeSecretKey.startsWith('sk_test_') ? 'test' : 'unknown';

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey);
    
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Minimum amounts vary by currency
    // USD: 50 cents, ZMW: 100 ngwee (K1)
    const minAmount = currency.toLowerCase() === 'zmw' ? 100 : 50;
    if (!amount || amount < minAmount) {
      return res.status(400).json({ error: `Amount must be at least ${minAmount} ${currency.toUpperCase()} cents` });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/[^/]*$/, '') || 'https://africarailways.com';
    const returnPage = metadata.railway === 'ZRL' ? 'zambia-railways.html' : 'book-tickets.html';

    // Create Stripe Checkout Session for better UX
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Train Ticket: ${metadata.from || 'Origin'} → ${metadata.to || 'Destination'}`,
              description: `${metadata.date || 'Travel Date'} | ${metadata.passengers || 1} passenger(s) | ${metadata.ticketClass || 'Economy'} class`,
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/${returnPage}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${returnPage}?payment=cancelled`,
      metadata: {
        ...metadata,
        source: 'africa-railways',
      },
    });

    res.status(200).json({
      clientSecret: session.id,
      sessionId: session.id,
      url: session.url,
      debug: { keyType, mode: keyType }
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      error: error.message,
      debug: {
        keyType,
        errorType: error.type || 'unknown',
        errorCode: error.code || 'none',
        stripeError: error.raw?.message || null
      }
    });
  }
};
