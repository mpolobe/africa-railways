/**
 * WhatsApp Business API Webhook
 * Receives incoming messages and routes to booking flow
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '947040551825655';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'africa_railways_verify_2026';

// In-memory session store (use Redis/KV in production)
const sessions = new Map();
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  // Handle incoming messages (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Extract message data
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        // Status update or other notification
        return res.status(200).json({ status: 'ok' });
      }

      const message = messages[0];
      const from = message.from; // Phone number
      const messageBody = message.text?.body || '';
      const messageType = message.type;

      console.log(`Received from ${from}: ${messageBody}`);

      // Process message and get response
      const response = await handleMessage(from, messageBody, messageType);

      // Send response back via WhatsApp
      await sendWhatsAppMessage(from, response);

      return res.status(200).json({ status: 'processed' });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(200).json({ status: 'error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle incoming message and return response
 */
async function handleMessage(phoneNumber, message, messageType) {
  // Get or create session
  let session = sessions.get(phoneNumber);
  if (!session || session.expiresAt < Date.now()) {
    session = {
      phoneNumber,
      expiresAt: Date.now() + SESSION_DURATION,
      context: {},
    };
    sessions.set(phoneNumber, session);
  }

  // Parse intent
  const { intent, entities } = parseMessage(message);

  switch (intent) {
    case 'search_trips':
      return await handleTripSearch(session, entities);
    
    case 'select_trip':
      return await handleTripSelection(session, message);
    
    case 'check_balance':
      return await handleBalanceCheck(session);
    
    case 'view_bookings':
      return await handleViewBookings(session);
    
    case 'help':
    default:
      return getHelpMessage();
  }
}

/**
 * Parse message using simple NLP
 */
function parseMessage(message) {
  const msg = message.toLowerCase().trim();

  // Trip selection (number response)
  if (/^[1-5]$/.test(msg) || msg.startsWith('book ')) {
    return { intent: 'select_trip', entities: { selection: msg } };
  }

  // Search for trips
  if (msg.includes('search') || msg.includes('find') || msg.includes('book') || msg.includes('train') || msg.includes('ticket')) {
    return { intent: 'search_trips', entities: extractSearchEntities(message) };
  }

  // Check balance
  if (msg.includes('balance') || msg.includes('africoin') || msg.includes('wallet')) {
    return { intent: 'check_balance', entities: {} };
  }

  // View bookings
  if (msg.includes('my booking') || msg.includes('my ticket') || msg.includes('booking')) {
    return { intent: 'view_bookings', entities: {} };
  }

  return { intent: 'help', entities: {} };
}

/**
 * Extract search parameters from natural language
 */
function extractSearchEntities(message) {
  const entities = {};

  // Extract origin/destination
  const routePatterns = [
    /from\s+(\w+)\s+to\s+(\w+)/i,
    /(\w+)\s+to\s+(\w+)/i,
    /(\w+)\s*[-–]\s*(\w+)/i,
  ];

  for (const pattern of routePatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.origin = match[1];
      entities.destination = match[2];
      break;
    }
  }

  // Extract date
  if (message.toLowerCase().includes('today')) {
    entities.date = new Date().toISOString().split('T')[0];
  } else if (message.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    entities.date = tomorrow.toISOString().split('T')[0];
  } else {
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      entities.date = dateMatch[1];
    }
  }

  return entities;
}

/**
 * Handle trip search
 */
async function handleTripSearch(session, entities) {
  if (!entities.origin || !entities.destination) {
    return `Please specify origin and destination.\n\nExample:\n"Search Nairobi to Mombasa tomorrow"\n"Find train Dar to Dodoma"`;
  }

  // Query trips from database
  const { data: trips, error } = await supabase
    .from('rail_trips')
    .select(`
      id,
      departure_time,
      arrival_time,
      service_date,
      available_seats,
      price_amount,
      price_currency,
      rail_routes (
        route_name,
        origin_station,
        destination_station
      )
    `)
    .gte('service_date', entities.date || new Date().toISOString().split('T')[0])
    .limit(5);

  if (error || !trips || trips.length === 0) {
    // Return sample data for demo
    const sampleTrips = [
      { id: 1, route: `${entities.origin} → ${entities.destination}`, time: '06:00', price: '2,500 KES', seats: 45 },
      { id: 2, route: `${entities.origin} → ${entities.destination}`, time: '10:30', price: '2,500 KES', seats: 32 },
      { id: 3, route: `${entities.origin} → ${entities.destination}`, time: '14:00', price: '3,200 KES', seats: 18 },
    ];

    session.context.searchResults = sampleTrips;
    sessions.set(session.phoneNumber, session);

    let response = `🚆 *Available Trips*\n${entities.origin} → ${entities.destination}\n\n`;
    sampleTrips.forEach((trip, i) => {
      response += `*${i + 1}.* ${trip.time} - ${trip.price}\n    Seats: ${trip.seats} available\n\n`;
    });
    response += `Reply with number (1-3) to book.`;
    return response;
  }

  // Store results in session
  session.context.searchResults = trips;
  sessions.set(session.phoneNumber, session);

  let response = `🚆 *Available Trips*\n\n`;
  trips.forEach((trip, i) => {
    response += `*${i + 1}.* ${trip.rail_routes?.route_name || 'Express'}\n`;
    response += `    Departs: ${trip.departure_time}\n`;
    response += `    Price: ${trip.price_amount} ${trip.price_currency}\n`;
    response += `    Seats: ${trip.available_seats}\n\n`;
  });
  response += `Reply with number to book.`;
  return response;
}

/**
 * Handle trip selection
 */
async function handleTripSelection(session, message) {
  const selection = parseInt(message.replace(/\D/g, '')) - 1;
  const trips = session.context?.searchResults;

  if (!trips || selection < 0 || selection >= trips.length) {
    return `Invalid selection. Please search for trips first.\n\nExample: "Search Nairobi to Mombasa tomorrow"`;
  }

  const selectedTrip = trips[selection];
  session.context.selectedTrip = selectedTrip;
  sessions.set(session.phoneNumber, session);

  return `✅ *Trip Selected*\n\n` +
    `Route: ${selectedTrip.route || selectedTrip.rail_routes?.route_name}\n` +
    `Time: ${selectedTrip.time || selectedTrip.departure_time}\n` +
    `Price: ${selectedTrip.price || `${selectedTrip.price_amount} ${selectedTrip.price_currency}`}\n\n` +
    `💳 *Payment Options:*\n` +
    `1️⃣ M-Pesa\n` +
    `2️⃣ Card\n` +
    `3️⃣ Africoin\n\n` +
    `Reply with payment method (1, 2, or 3)`;
}

/**
 * Handle balance check
 */
async function handleBalanceCheck(session) {
  const { data: user } = await supabase
    .from('sentinel_users')
    .select('africoin_balance, total_reports, accuracy_score')
    .eq('phone_number', session.phoneNumber)
    .single();

  if (!user) {
    return `🪙 *Africoin Wallet*\n\nNo account found for this number.\n\nStart contributing as a Sentinel to earn Africoin rewards!`;
  }

  return `🪙 *Your Africoin Balance*\n\n` +
    `Balance: ${user.africoin_balance} Ⱥ\n` +
    `Reports: ${user.total_reports}\n` +
    `Accuracy: ${user.accuracy_score}%`;
}

/**
 * Handle view bookings
 */
async function handleViewBookings(session) {
  const { data: bookings } = await supabase
    .from('rail_bookings')
    .select('booking_reference, status, created_at')
    .eq('passenger_phone', session.phoneNumber)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!bookings || bookings.length === 0) {
    return `🎫 *My Bookings*\n\nNo bookings found.\n\nSearch for trips to book:\n"Search Nairobi to Mombasa tomorrow"`;
  }

  let response = `🎫 *Your Recent Bookings*\n\n`;
  bookings.forEach(booking => {
    response += `Ref: ${booking.booking_reference}\n`;
    response += `Status: ${booking.status}\n`;
    response += `Date: ${new Date(booking.created_at).toLocaleDateString()}\n\n`;
  });
  return response;
}

/**
 * Get help message
 */
function getHelpMessage() {
  return `🚆 *Africa Railways*\n\n` +
    `How can I help you?\n\n` +
    `Try:\n` +
    `• "Search Nairobi to Mombasa tomorrow"\n` +
    `• "My bookings"\n` +
    `• "Africoin balance"\n` +
    `• "Help"\n\n` +
    `Or visit: africa-railways.vercel.app`;
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.log(`[Demo] Would send to ${to}: ${text}`);
    return { success: true, demo: true };
  }

  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text },
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    console.error('WhatsApp send error:', data.error);
    return { success: false, error: data.error };
  }

  return { success: true, messageId: data.messages?.[0]?.id };
}
