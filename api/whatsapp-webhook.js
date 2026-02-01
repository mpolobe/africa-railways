/**
 * WhatsApp Business API Webhook - Main Entry Point
 * Receives incoming messages from Meta and routes to Session Manager for booking
 * 
 * Phone: +260 966 165 444
 * Phone Number ID: 947040551825655
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '947040551825655';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'africa_railways_verify_2026';

// Session states
const STATES = {
  IDLE: 'idle',
  AWAITING_ORIGIN: 'awaiting_origin',
  AWAITING_DESTINATION: 'awaiting_destination',
  AWAITING_DATE: 'awaiting_date',
  AWAITING_CLASS: 'awaiting_class',
  AWAITING_PASSENGERS: 'awaiting_passengers',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  AWAITING_PAYMENT: 'awaiting_payment'
};

// In-memory sessions (use Redis/KV in production)
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

// Stations
const STATIONS = [
  'Lusaka', 'Livingstone', 'Kitwe', 'Ndola', 'Kapiri Mposhi',
  'Dar es Salaam', 'Nairobi', 'Mombasa', 'Dodoma'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Webhook verification (GET from Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  // Handle incoming messages (POST from Meta)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        return res.status(200).json({ status: 'ok' });
      }

      const message = messages[0];
      const from = message.from;
      const messageBody = message.text?.body || '';

      console.log(`📱 WhatsApp from ${from}: ${messageBody}`);

      // Process via session manager
      const response = await processMessage(from, messageBody);

      // Send response
      await sendWhatsAppMessage(from, response);

      return res.status(200).json({ status: 'processed' });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(200).json({ status: 'error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Session Manager
function getSession(phone) {
  let session = sessions.get(phone);
  if (!session || Date.now() > session.expiresAt) {
    session = {
      phone,
      state: STATES.IDLE,
      booking: {},
      expiresAt: Date.now() + SESSION_TTL
    };
    sessions.set(phone, session);
  }
  return session;
}

function updateSession(phone, updates) {
  const session = getSession(phone);
  Object.assign(session, updates, { expiresAt: Date.now() + SESSION_TTL });
  sessions.set(phone, session);
  return session;
}

async function processMessage(phone, message) {
  const session = getSession(phone);
  const msg = message.toLowerCase().trim();

  // Reset commands
  if (msg === 'cancel' || msg === 'reset' || msg === '0') {
    sessions.delete(phone);
    return getWelcome();
  }

  if (msg === 'help' || msg === '?') {
    return `ℹ️ *Help*\n\n• Type "book" to start\n• Type "cancel" to reset\n• Type number to select option\n\nSupport: +260966165444`;
  }

  switch (session.state) {
    case STATES.IDLE:
      if (msg.includes('book') || msg === '1') {
        updateSession(phone, { state: STATES.AWAITING_ORIGIN });
        return `🚆 *Book Train Ticket*\n\nWhere from?\n\n` +
          STATIONS.map((s, i) => `${i + 1}. ${s}`).join('\n') +
          `\n\nReply with number`;
      }
      if (msg.includes('ticket') || msg.includes('booking') || msg === '2') {
        return await checkBookings(phone);
      }
      if (msg.includes('balance') || msg === '3') {
        return await checkBalance(phone);
      }
      return getWelcome();

    case STATES.AWAITING_ORIGIN:
      const origin = parseStation(msg);
      if (!origin) return `❌ Invalid. Select 1-${STATIONS.length}`;
      updateSession(phone, { state: STATES.AWAITING_DESTINATION, booking: { origin } });
      return `✅ From: *${origin}*\n\nWhere to?\n\n` +
        STATIONS.filter(s => s !== origin).map((s, i) => `${i + 1}. ${s}`).join('\n');

    case STATES.AWAITING_DESTINATION:
      const dest = parseStation(msg, session.booking.origin);
      if (!dest) return `❌ Invalid destination`;
      updateSession(phone, { state: STATES.AWAITING_DATE, booking: { ...session.booking, destination: dest } });
      return `✅ *${session.booking.origin} → ${dest}*\n\nWhen?\n\n1. Today\n2. Tomorrow\n3. This week`;

    case STATES.AWAITING_DATE:
      const date = parseDate(msg);
      if (!date) return `❌ Select 1-3 or type date`;
      updateSession(phone, { state: STATES.AWAITING_CLASS, booking: { ...session.booking, date } });
      return `✅ Date: *${date}*\n\nClass:\n\n1. Economy - $15\n2. Business - $30\n3. Sleeper - $50`;

    case STATES.AWAITING_CLASS:
      const classes = { '1': ['Economy', 15], '2': ['Business', 30], '3': ['Sleeper', 50] };
      const cls = classes[msg];
      if (!cls) return `❌ Select 1-3`;
      updateSession(phone, { state: STATES.AWAITING_PASSENGERS, booking: { ...session.booking, class: cls[0], price: cls[1] } });
      return `✅ *${cls[0]}* ($${cls[1]})\n\nPassengers? (1-5)`;

    case STATES.AWAITING_PASSENGERS:
      const count = parseInt(msg);
      if (isNaN(count) || count < 1 || count > 5) return `❌ Enter 1-5`;
      const total = session.booking.price * count;
      updateSession(phone, { state: STATES.AWAITING_CONFIRMATION, booking: { ...session.booking, passengers: count, total } });
      const b = session.booking;
      return `📋 *Booking Summary*\n\n` +
        `${b.origin} → ${b.destination}\n` +
        `Date: ${b.date}\n` +
        `Class: ${b.class}\n` +
        `Passengers: ${count}\n` +
        `Total: *$${total}*\n\n` +
        `1. ✅ Confirm\n2. ❌ Cancel`;

    case STATES.AWAITING_CONFIRMATION:
      if (msg === '1' || msg.includes('yes') || msg.includes('confirm')) {
        updateSession(phone, { state: STATES.AWAITING_PAYMENT });
        return `💳 *Payment*\n\n1. M-Pesa\n2. Card\n3. Africoin`;
      }
      if (msg === '2' || msg.includes('cancel')) {
        sessions.delete(phone);
        return `❌ Cancelled.\n\n` + getWelcome();
      }
      return `Reply 1 to confirm, 2 to cancel`;

    case STATES.AWAITING_PAYMENT:
      const methods = { '1': 'M-Pesa', '2': 'Card', '3': 'Africoin' };
      const method = methods[msg];
      if (!method) return `Select 1-3`;

      // Create booking
      const ref = 'AFC-' + Date.now().toString(36).toUpperCase();
      const booking = { ...session.booking, reference: ref, payment: method };

      // Save to DB
      try {
        await supabase.from('bookings').insert({
          booking_ref: ref,
          passenger_phone: phone,
          from_station: booking.origin,
          to_station: booking.destination,
          travel_date: booking.date,
          class: booking.class,
          passengers: booking.passengers,
          total_price_usd: booking.total,
          payment_method: method.toLowerCase(),
          booking_status: 'confirmed'
        });
      } catch (e) {
        console.error('DB error:', e);
      }

      sessions.delete(phone);
      return `✅ *Booking Confirmed!*\n\n` +
        `Ref: *${ref}*\n` +
        `${booking.origin} → ${booking.destination}\n` +
        `${booking.date} | ${booking.class}\n` +
        `${booking.passengers} pax | $${booking.total}\n\n` +
        `E-ticket sent to this number.\n\nSafe travels! 🚆`;

    default:
      return getWelcome();
  }
}

function parseStation(input, exclude = null) {
  const filtered = exclude ? STATIONS.filter(s => s !== exclude) : STATIONS;
  const idx = parseInt(input) - 1;
  if (idx >= 0 && idx < filtered.length) return filtered[idx];
  return filtered.find(s => s.toLowerCase().includes(input.toLowerCase()));
}

function parseDate(input) {
  const today = new Date();
  const format = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (input === '1' || input === 'today') return format(today);
  if (input === '2' || input === 'tomorrow') {
    today.setDate(today.getDate() + 1);
    return format(today);
  }
  if (input === '3') {
    today.setDate(today.getDate() + 3);
    return format(today);
  }
  return null;
}

async function checkBookings(phone) {
  const { data } = await supabase
    .from('bookings')
    .select('booking_ref, from_station, to_station, travel_date, booking_status')
    .eq('passenger_phone', phone)
    .order('created_at', { ascending: false })
    .limit(3);

  if (!data?.length) return `🎫 No bookings.\n\nReply 1 to book.`;
  let msg = `🎫 *Your Bookings*\n\n`;
  data.forEach(b => {
    msg += `*${b.booking_ref}*\n${b.from_station} → ${b.to_station}\n${b.travel_date} | ${b.booking_status}\n\n`;
  });
  return msg;
}

async function checkBalance(phone) {
  const { data } = await supabase
    .from('sentinel_users')
    .select('africoin_balance')
    .eq('phone_number', phone)
    .single();
  return `🪙 *Africoin*: ${data?.africoin_balance || 0} AFC`;
}

function getWelcome() {
  return `🚆 *Africa Railways*\n\nHow can I help?\n\n1. Book ticket\n2. My bookings\n3. Africoin balance\n\nReply with number`;
}

async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.log(`[Demo] → ${to}: ${text}`);
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
    console.error('WhatsApp error:', data.error);
    return { success: false, error: data.error };
  }
  return { success: true, messageId: data.messages?.[0]?.id };
}
