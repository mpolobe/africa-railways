/**
 * WhatsApp Booking Session Manager
 * Manages conversational booking flow state for WhatsApp users
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Session states for booking flow
const STATES = {
  IDLE: 'idle',
  AWAITING_ORIGIN: 'awaiting_origin',
  AWAITING_DESTINATION: 'awaiting_destination',
  AWAITING_DATE: 'awaiting_date',
  AWAITING_CLASS: 'awaiting_class',
  AWAITING_PASSENGERS: 'awaiting_passengers',
  AWAITING_CONFIRMATION: 'awaiting_confirmation',
  AWAITING_PAYMENT: 'awaiting_payment',
  COMPLETED: 'completed'
};

// In-memory sessions (use Redis in production)
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

// Popular stations
const STATIONS = [
  'Lusaka', 'Livingstone', 'Kitwe', 'Ndola', 'Kapiri Mposhi',
  'Dar es Salaam', 'Nairobi', 'Mombasa', 'Dodoma'
];

class SessionManager {
  static getSession(phoneNumber) {
    let session = sessions.get(phoneNumber);
    if (!session || Date.now() > session.expiresAt) {
      session = {
        phoneNumber,
        state: STATES.IDLE,
        booking: {},
        expiresAt: Date.now() + SESSION_TTL,
        createdAt: Date.now()
      };
      sessions.set(phoneNumber, session);
    }
    return session;
  }

  static updateSession(phoneNumber, updates) {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates, { expiresAt: Date.now() + SESSION_TTL });
    sessions.set(phoneNumber, session);
    return session;
  }

  static clearSession(phoneNumber) {
    sessions.delete(phoneNumber);
  }

  static async processMessage(phoneNumber, message) {
    const session = this.getSession(phoneNumber);
    const msg = message.toLowerCase().trim();

    // Handle cancel/reset
    if (msg === 'cancel' || msg === 'reset' || msg === '0') {
      this.clearSession(phoneNumber);
      return this.getWelcomeMessage();
    }

    // Handle help
    if (msg === 'help' || msg === '?') {
      return this.getHelpMessage();
    }

    // Route based on state
    switch (session.state) {
      case STATES.IDLE:
        return this.handleIdle(session, msg);
      case STATES.AWAITING_ORIGIN:
        return this.handleOrigin(session, msg);
      case STATES.AWAITING_DESTINATION:
        return this.handleDestination(session, msg);
      case STATES.AWAITING_DATE:
        return this.handleDate(session, msg);
      case STATES.AWAITING_CLASS:
        return this.handleClass(session, msg);
      case STATES.AWAITING_PASSENGERS:
        return this.handlePassengers(session, msg);
      case STATES.AWAITING_CONFIRMATION:
        return this.handleConfirmation(session, msg);
      case STATES.AWAITING_PAYMENT:
        return this.handlePayment(session, msg);
      default:
        return this.getWelcomeMessage();
    }
  }

  static handleIdle(session, msg) {
    if (msg.includes('book') || msg === '1') {
      this.updateSession(session.phoneNumber, { state: STATES.AWAITING_ORIGIN });
      return `🚆 *Book Train Ticket*\n\nWhere are you traveling from?\n\n` +
        STATIONS.map((s, i) => `${i + 1}. ${s}`).join('\n') +
        `\n\nReply with number or station name`;
    }
    if (msg.includes('ticket') || msg.includes('booking') || msg === '2') {
      return this.checkBookings(session.phoneNumber);
    }
    if (msg.includes('balance') || msg === '3') {
      return this.checkBalance(session.phoneNumber);
    }
    return this.getWelcomeMessage();
  }

  static handleOrigin(session, msg) {
    const station = this.parseStation(msg);
    if (!station) {
      return `❌ Station not found. Please select:\n\n` +
        STATIONS.map((s, i) => `${i + 1}. ${s}`).join('\n');
    }
    this.updateSession(session.phoneNumber, {
      state: STATES.AWAITING_DESTINATION,
      booking: { ...session.booking, origin: station }
    });
    return `✅ From: *${station}*\n\nWhere to?\n\n` +
      STATIONS.filter(s => s !== station).map((s, i) => `${i + 1}. ${s}`).join('\n');
  }

  static handleDestination(session, msg) {
    const station = this.parseStation(msg);
    if (!station || station === session.booking.origin) {
      return `❌ Please select a different destination:\n\n` +
        STATIONS.filter(s => s !== session.booking.origin).map((s, i) => `${i + 1}. ${s}`).join('\n');
    }
    this.updateSession(session.phoneNumber, {
      state: STATES.AWAITING_DATE,
      booking: { ...session.booking, destination: station }
    });
    return `✅ Route: *${session.booking.origin} → ${station}*\n\n` +
      `When do you want to travel?\n\n` +
      `1. Today\n2. Tomorrow\n3. This week\n\nOr type date (e.g., 15 Feb)`;
  }

  static handleDate(session, msg) {
    const date = this.parseDate(msg);
    if (!date) {
      return `❌ Invalid date. Try:\n1. Today\n2. Tomorrow\n3. Date like "15 Feb"`;
    }
    this.updateSession(session.phoneNumber, {
      state: STATES.AWAITING_CLASS,
      booking: { ...session.booking, date }
    });
    return `✅ Date: *${date}*\n\nSelect class:\n\n` +
      `1. Economy - $15\n2. Business - $30\n3. Sleeper - $50`;
  }

  static handleClass(session, msg) {
    const classes = { '1': 'Economy', '2': 'Business', '3': 'Sleeper', 'economy': 'Economy', 'business': 'Business', 'sleeper': 'Sleeper' };
    const prices = { 'Economy': 15, 'Business': 30, 'Sleeper': 50 };
    const ticketClass = classes[msg] || classes[msg.toLowerCase()];
    if (!ticketClass) {
      return `❌ Select class:\n1. Economy\n2. Business\n3. Sleeper`;
    }
    this.updateSession(session.phoneNumber, {
      state: STATES.AWAITING_PASSENGERS,
      booking: { ...session.booking, class: ticketClass, price: prices[ticketClass] }
    });
    return `✅ Class: *${ticketClass}* ($${prices[ticketClass]})\n\nHow many passengers? (1-5)`;
  }

  static handlePassengers(session, msg) {
    const count = parseInt(msg);
    if (isNaN(count) || count < 1 || count > 5) {
      return `❌ Enter 1-5 passengers`;
    }
    const total = session.booking.price * count;
    this.updateSession(session.phoneNumber, {
      state: STATES.AWAITING_CONFIRMATION,
      booking: { ...session.booking, passengers: count, total }
    });
    const b = session.booking;
    return `📋 *Booking Summary*\n\n` +
      `Route: ${b.origin} → ${b.destination}\n` +
      `Date: ${b.date}\n` +
      `Class: ${b.class}\n` +
      `Passengers: ${count}\n` +
      `Total: *$${total}*\n\n` +
      `Reply:\n1. ✅ Confirm\n2. ❌ Cancel`;
  }

  static async handleConfirmation(session, msg) {
    if (msg === '1' || msg.includes('confirm') || msg.includes('yes')) {
      this.updateSession(session.phoneNumber, { state: STATES.AWAITING_PAYMENT });
      return `💳 *Payment*\n\nSelect method:\n\n` +
        `1. M-Pesa\n2. Card\n3. Africoin\n\nReply with number`;
    }
    if (msg === '2' || msg.includes('cancel') || msg.includes('no')) {
      this.clearSession(session.phoneNumber);
      return `❌ Booking cancelled.\n\n` + this.getWelcomeMessage();
    }
    return `Reply 1 to confirm or 2 to cancel`;
  }

  static async handlePayment(session, msg) {
    const methods = { '1': 'mpesa', '2': 'card', '3': 'africoin' };
    const method = methods[msg];
    if (!method) {
      return `Select payment:\n1. M-Pesa\n2. Card\n3. Africoin`;
    }

    // Create booking
    const bookingRef = 'AFC-' + Date.now().toString(36).toUpperCase();
    const booking = {
      ...session.booking,
      reference: bookingRef,
      paymentMethod: method,
      phone: session.phoneNumber,
      status: 'confirmed'
    };

    // Save to database
    try {
      await supabase.from('bookings').insert({
        booking_ref: bookingRef,
        passenger_phone: session.phoneNumber,
        from_station: booking.origin,
        to_station: booking.destination,
        travel_date: booking.date,
        class: booking.class,
        passengers: booking.passengers,
        total_price_usd: booking.total,
        payment_method: method,
        booking_status: 'confirmed'
      });
    } catch (e) {
      console.error('DB error:', e);
    }

    this.clearSession(session.phoneNumber);

    return `✅ *Booking Confirmed!*\n\n` +
      `Reference: *${bookingRef}*\n` +
      `Route: ${booking.origin} → ${booking.destination}\n` +
      `Date: ${booking.date}\n` +
      `Class: ${booking.class}\n` +
      `Passengers: ${booking.passengers}\n` +
      `Total: $${booking.total}\n\n` +
      `Your e-ticket has been sent to this number.\n\n` +
      `Safe travels! 🚆`;
  }

  static parseStation(input) {
    const idx = parseInt(input) - 1;
    if (idx >= 0 && idx < STATIONS.length) return STATIONS[idx];
    return STATIONS.find(s => s.toLowerCase().includes(input.toLowerCase()));
  }

  static parseDate(input) {
    if (input === '1' || input === 'today') {
      return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    if (input === '2' || input === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    if (input === '3') {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    // Try parsing custom date
    const parsed = Date.parse(input + ' 2026');
    if (!isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return null;
  }

  static async checkBookings(phone) {
    const { data } = await supabase
      .from('bookings')
      .select('booking_ref, from_station, to_station, travel_date, booking_status')
      .eq('passenger_phone', phone)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!data?.length) {
      return `🎫 No bookings found.\n\nReply 1 to book a ticket.`;
    }
    let msg = `🎫 *Your Bookings*\n\n`;
    data.forEach(b => {
      msg += `Ref: ${b.booking_ref}\n${b.from_station} → ${b.to_station}\nDate: ${b.travel_date}\nStatus: ${b.booking_status}\n\n`;
    });
    return msg;
  }

  static async checkBalance(phone) {
    const { data } = await supabase
      .from('sentinel_users')
      .select('africoin_balance')
      .eq('phone_number', phone)
      .single();

    return `🪙 *Africoin Balance*\n\n${data?.africoin_balance || 0} AFC\n\nEarn more by contributing as a Sentinel!`;
  }

  static getWelcomeMessage() {
    return `🚆 *Africa Railways*\n\nHow can I help?\n\n1. Book ticket\n2. My bookings\n3. Africoin balance\n\nReply with number or type your request.`;
  }

  static getHelpMessage() {
    return `ℹ️ *Help*\n\n• Type "book" to start booking\n• Type "cancel" to reset\n• Type "help" anytime\n\nSupport: +260966165444`;
  }
}

export default SessionManager;
export { STATES };
