/**
 * Offline-First Ticket Service
 * 
 * Designed for African connectivity:
 * - AsyncStorage is PRIMARY (works offline)
 * - Supabase syncs in background when online
 * - All operations work without internet
 * - Automatic sync when connection restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

// Storage keys
const KEYS = {
  TICKETS: 'user_tickets',
  NFTS: 'user_nfts',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync_time',
  USER_PHONE: 'user_phone',
};

// African-themed artwork for NFT souvenirs
const AFRICAN_ARTWORK = {
  'dar': {
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400',
    theme: 'Indian Ocean Sunrise',
    colors: ['#FF6B35', '#F7931E', '#1E3A5F'],
    culture: 'Swahili Coast',
  },
  'kapiri': {
    image: 'https://images.unsplash.com/photo-1534177616064-ef1385e44e60?w=400',
    theme: 'Railway Junction',
    colors: ['#1A1A2E', '#FFB800', '#E94560'],
    culture: 'TAZARA Heritage',
  },
  'lusaka': {
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400',
    theme: 'Capital City',
    colors: ['#2C3E50', '#E74C3C', '#27AE60'],
    culture: 'Urban Zambia',
  },
  'mbeya': {
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400',
    theme: 'Southern Highlands',
    colors: ['#2D5016', '#8BC34A', '#4CAF50'],
    culture: 'Nyakyusa Heritage',
  },
  'kasama': {
    image: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400',
    theme: 'Northern Wilderness',
    colors: ['#0077B6', '#00B4D8', '#90E0EF'],
    culture: 'Bemba Kingdom',
  },
  'tunduma': {
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400',
    theme: 'Border Crossing',
    colors: ['#D4A574', '#8B4513', '#FFD700'],
    culture: 'Trade Route Legacy',
  },
  'default': {
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400',
    theme: 'African Journey',
    colors: ['#FFB800', '#FF6B35', '#1A1A2E'],
    culture: 'Pan-African',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = (prefix = 'TKT') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const generateSeat = (ticketClass) => {
  const car = ticketClass === 'first' ? 1 : ticketClass === 'business' ? 2 : Math.floor(Math.random() * 3) + 3;
  const seat = Math.floor(Math.random() * 40) + 1;
  const row = String.fromCharCode(65 + Math.floor(Math.random() * 4));
  return `Car ${car}, Seat ${seat}${row}`;
};

const getArtworkForRoute = (route) => {
  const routeLower = route.toLowerCase();
  for (const [key, artwork] of Object.entries(AFRICAN_ARTWORK)) {
    if (key !== 'default' && routeLower.includes(key)) {
      return artwork;
    }
  }
  return AFRICAN_ARTWORK.default;
};

const checkOnline = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch {
    return false;
  }
};

// ============================================
// LOCAL STORAGE OPERATIONS (PRIMARY)
// ============================================

const getLocalTickets = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get local tickets:', error);
    return [];
  }
};

const saveLocalTickets = async (tickets) => {
  try {
    await AsyncStorage.setItem(KEYS.TICKETS, JSON.stringify(tickets));
  } catch (error) {
    console.error('Failed to save local tickets:', error);
  }
};

const getLocalNFTs = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.NFTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get local NFTs:', error);
    return [];
  }
};

const saveLocalNFTs = async (nfts) => {
  try {
    await AsyncStorage.setItem(KEYS.NFTS, JSON.stringify(nfts));
  } catch (error) {
    console.error('Failed to save local NFTs:', error);
  }
};

// Queue operations for sync
const addToSyncQueue = async (operation) => {
  try {
    const queue = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    const operations = queue ? JSON.parse(queue) : [];
    operations.push({ ...operation, queuedAt: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(operations));
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

const getSyncQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return queue ? JSON.parse(queue) : [];
  } catch {
    return [];
  }
};

const clearSyncQueue = async () => {
  await AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
};

// ============================================
// MAIN API
// ============================================

/**
 * Create a new ticket booking
 * Works completely offline - syncs to Supabase when online
 */
export const createBooking = async (bookingData) => {
  const ticketId = generateId('TKT');
  const nftId = generateId('NFT');
  const bookingRef = generateId('BKG');
  const artwork = getArtworkForRoute(bookingData.route);
  
  const routeParts = bookingData.route.split(' → ');
  
  // Create ticket object
  const ticket = {
    id: ticketId,
    booking_ref: bookingRef,
    ticket_id: ticketId,
    nft_id: nftId,
    
    // Passenger
    passenger_name: bookingData.passengerName || 'Passenger',
    passenger_phone: bookingData.passengerPhone || '',
    
    // Journey
    route: bookingData.route,
    from_station: routeParts[0] || '',
    to_station: routeParts[1] || '',
    travel_date: bookingData.date,
    departure_time: bookingData.departureTime || '08:00',
    arrival_time: bookingData.arrivalTime || '18:00',
    train: bookingData.train || 'TAZARA Express',
    
    // Ticket details
    class: bookingData.class,
    seat: generateSeat(bookingData.class),
    passengers: bookingData.passengers || 1,
    is_return_trip: bookingData.isReturnTrip || false,
    
    // Pricing
    base_price_usd: bookingData.priceUSD,
    total_price_usd: bookingData.priceUSD,
    local_currency: bookingData.localCurrency || 'USD',
    total_price_local: bookingData.priceLocal,
    total_price_afrc: bookingData.priceUSD,
    payment_method: bookingData.paymentMethod,
    
    // Status
    booking_status: 'confirmed',
    payment_status: 'completed',
    
    // QR code data
    qr_data: JSON.stringify({
      ticketId,
      route: bookingData.route,
      date: bookingData.date,
      class: bookingData.class,
      seat: generateSeat(bookingData.class),
    }),
    
    // Timestamps
    created_at: new Date().toISOString(),
    synced: false,
  };

  // Create NFT souvenir
  const nft = {
    id: nftId,
    souvenir_id: generateId('SOU'),
    ticket_id: ticketId,
    booking_id: ticketId,
    
    name: `${ticket.train} - ${ticket.class}`,
    description: `Commemorative NFT for your journey: ${bookingData.route}. Celebrating ${artwork.culture} heritage.`,
    
    route: bookingData.route,
    travel_date: bookingData.date,
    class: bookingData.class,
    
    // Artwork
    theme: artwork.theme,
    culture: artwork.culture,
    image_url: artwork.image,
    colors: artwork.colors,
    
    // Status
    status: 'valid',
    rarity: 'Unique',
    
    created_at: new Date().toISOString(),
    synced: false,
  };

  // Save locally (PRIMARY)
  const tickets = await getLocalTickets();
  tickets.unshift(ticket);
  await saveLocalTickets(tickets);

  const nfts = await getLocalNFTs();
  nfts.unshift(nft);
  await saveLocalNFTs(nfts);

  // Queue for sync
  await addToSyncQueue({ type: 'CREATE_BOOKING', data: ticket });
  await addToSyncQueue({ type: 'CREATE_NFT', data: nft });

  // Try background sync (non-blocking)
  syncToSupabase().catch(() => {});

  return { ticket, nft };
};

/**
 * Get all tickets (from local storage)
 */
export const getTickets = async () => {
  // Try background sync first (non-blocking)
  syncFromSupabase().catch(() => {});
  
  return getLocalTickets();
};

/**
 * Get all NFTs (from local storage)
 */
export const getNFTs = async () => {
  return getLocalNFTs();
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (ticketId) => {
  const tickets = await getLocalTickets();
  return tickets.find(t => t.ticket_id === ticketId || t.id === ticketId);
};

/**
 * Validate ticket (for scanning)
 * Works offline using local data
 */
export const validateTicket = async (qrData) => {
  try {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    const ticket = await getTicketById(data.ticketId);
    
    if (!ticket) {
      return { valid: false, error: 'Ticket not found' };
    }
    
    if (ticket.booking_status === 'used') {
      return { 
        valid: false, 
        error: 'Ticket already used',
        usedAt: ticket.used_at,
        ticket 
      };
    }
    
    if (ticket.booking_status === 'cancelled') {
      return { valid: false, error: 'Ticket cancelled', ticket };
    }
    
    // Check date
    const ticketDate = new Date(ticket.travel_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    ticketDate.setHours(0, 0, 0, 0);
    
    if (ticketDate < today) {
      return { valid: false, error: 'Ticket date has passed', ticket };
    }
    
    return { valid: true, ticket };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code' };
  }
};

/**
 * Mark ticket as used (after scanning)
 */
export const markTicketUsed = async (ticketId, staffInfo = {}) => {
  const tickets = await getLocalTickets();
  const index = tickets.findIndex(t => t.ticket_id === ticketId || t.id === ticketId);
  
  if (index === -1) {
    return { success: false, error: 'Ticket not found' };
  }
  
  tickets[index] = {
    ...tickets[index],
    booking_status: 'used',
    used_at: new Date().toISOString(),
    used_by: staffInfo.staffId || 'STAFF',
    used_location: staffInfo.location || 'Station',
    synced: false,
  };
  
  await saveLocalTickets(tickets);
  
  // Update NFT status
  const nfts = await getLocalNFTs();
  const nftIndex = nfts.findIndex(n => n.ticket_id === ticketId);
  if (nftIndex !== -1) {
    nfts[nftIndex].status = 'used';
    await saveLocalNFTs(nfts);
  }
  
  // Queue for sync
  await addToSyncQueue({ 
    type: 'MARK_USED', 
    data: { ticketId, ...tickets[index] } 
  });
  
  // Try background sync
  syncToSupabase().catch(() => {});
  
  return { success: true, ticket: tickets[index] };
};

// ============================================
// SYNC OPERATIONS (BACKGROUND)
// ============================================

/**
 * Sync local changes to Supabase
 * Called automatically, non-blocking
 */
export const syncToSupabase = async () => {
  if (!(await checkOnline())) return { synced: 0 };
  
  const queue = await getSyncQueue();
  if (queue.length === 0) return { synced: 0 };
  
  let synced = 0;
  
  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'CREATE_BOOKING':
          const bookingData = { ...operation.data };
          delete bookingData.synced;
          delete bookingData.qr_data;
          
          await supabase.from('bookings').upsert(bookingData, { 
            onConflict: 'ticket_id' 
          });
          synced++;
          break;
          
        case 'CREATE_NFT':
          const nftData = { ...operation.data };
          delete nftData.synced;
          delete nftData.colors;
          
          await supabase.from('nft_souvenirs').upsert(nftData, {
            onConflict: 'souvenir_id'
          });
          synced++;
          break;
          
        case 'MARK_USED':
          await supabase
            .from('bookings')
            .update({
              booking_status: 'used',
              used_at: operation.data.used_at,
              used_by: operation.data.used_by,
              used_location: operation.data.used_location,
            })
            .eq('ticket_id', operation.data.ticketId);
          synced++;
          break;
      }
    } catch (error) {
      console.warn('Sync operation failed:', error.message);
    }
  }
  
  if (synced > 0) {
    await clearSyncQueue();
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  }
  
  return { synced };
};

/**
 * Sync from Supabase to local (fetch new tickets from other devices)
 */
export const syncFromSupabase = async () => {
  if (!(await checkOnline())) return;
  
  try {
    const { data: remoteTickets } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (remoteTickets && remoteTickets.length > 0) {
      const localTickets = await getLocalTickets();
      const localIds = new Set(localTickets.map(t => t.ticket_id));
      
      // Add remote tickets not in local
      const newTickets = remoteTickets.filter(t => !localIds.has(t.ticket_id));
      if (newTickets.length > 0) {
        const merged = [...newTickets, ...localTickets];
        await saveLocalTickets(merged);
      }
    }
  } catch (error) {
    console.warn('Sync from Supabase failed:', error.message);
  }
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
  const queue = await getSyncQueue();
  const lastSync = await AsyncStorage.getItem(KEYS.LAST_SYNC);
  const isOnline = await checkOnline();
  
  return {
    pendingOperations: queue.length,
    lastSyncTime: lastSync,
    isOnline,
  };
};

/**
 * Force sync (user-triggered)
 */
export const forceSync = async () => {
  await syncToSupabase();
  await syncFromSupabase();
  return getSyncStatus();
};

export default {
  createBooking,
  getTickets,
  getNFTs,
  getTicketById,
  validateTicket,
  markTicketUsed,
  syncToSupabase,
  syncFromSupabase,
  getSyncStatus,
  forceSync,
};
