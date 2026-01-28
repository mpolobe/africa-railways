// Stripe Transactions API for OCC Dashboard
// Fetches payment data from Stripe for revenue tracking

module.exports = async (req, res) => {
  const Stripe = require('stripe');
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    return res.status(200).json({
      success: true,
      summary: {
        total_revenue: 0,
        pending_revenue: 0,
        today_revenue: 0,
        today_transactions: 0,
        total_transactions: 0,
        failed_transactions: 0,
        avg_transaction: 0,
        available_balance: 0,
        pending_balance: 0,
        currency: 'USD',
      },
      transactions: [],
      period: req.query?.period || '7d',
      fetched_at: new Date().toISOString(),
      note: 'Stripe not configured',
    });
  }
  
  const stripe = new Stripe(stripeSecretKey);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = '7d', limit = 100 } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
      },
      limit: parseInt(limit),
      expand: ['data.charges'],
    });

    // Fetch balance transactions for more details
    const balanceTransactions = await stripe.balanceTransactions.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
      },
      limit: parseInt(limit),
      type: 'charge',
    });

    // Calculate summary statistics
    const transactions = paymentIntents.data.map(pi => ({
      id: pi.id,
      amount: pi.amount / 100, // Convert from cents
      currency: pi.currency.toUpperCase(),
      status: pi.status,
      created: new Date(pi.created * 1000).toISOString(),
      description: pi.description || 'Train Ticket',
      metadata: pi.metadata,
      customer_email: pi.receipt_email,
      payment_method: pi.payment_method_types?.[0] || 'card',
    }));

    // Calculate totals
    const succeeded = transactions.filter(t => t.status === 'succeeded');
    const pending = transactions.filter(t => t.status === 'processing' || t.status === 'requires_capture');
    const failed = transactions.filter(t => t.status === 'canceled' || t.status === 'requires_payment_method');

    const totalRevenue = succeeded.reduce((sum, t) => sum + t.amount, 0);
    const pendingRevenue = pending.reduce((sum, t) => sum + t.amount, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTransactions = succeeded.filter(t => new Date(t.created) >= todayStart);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get current balance
    const balance = await stripe.balance.retrieve();
    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

    res.status(200).json({
      success: true,
      summary: {
        total_revenue: totalRevenue,
        pending_revenue: pendingRevenue,
        today_revenue: todayRevenue,
        today_transactions: todayTransactions.length,
        total_transactions: succeeded.length,
        failed_transactions: failed.length,
        avg_transaction: succeeded.length > 0 ? totalRevenue / succeeded.length : 0,
        available_balance: availableBalance,
        pending_balance: pendingBalance,
        currency: 'USD',
      },
      transactions: transactions.slice(0, 50), // Return last 50 transactions
      period: period,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stripe API error:', error);
    
    // Return mock data if Stripe is not configured
    if (error.type === 'StripeAuthenticationError') {
      return res.status(200).json({
        success: true,
        summary: {
          total_revenue: 0,
          pending_revenue: 0,
          today_revenue: 0,
          today_transactions: 0,
          total_transactions: 0,
          failed_transactions: 0,
          avg_transaction: 0,
          available_balance: 0,
          pending_balance: 0,
          currency: 'USD',
        },
        transactions: [],
        period: req.query.period || '7d',
        fetched_at: new Date().toISOString(),
        note: 'Stripe not configured - showing empty data',
      });
    }
    
    res.status(500).json({ error: error.message });
  }
};
