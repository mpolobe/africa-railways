/**
 * Pass Service
 * Weekly and Monthly travel passes management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deductFromWallet, hasSufficientBalance } from './walletService';

const KEYS = {
  PASSES: 'user_passes',
  PASS_USAGE: 'pass_usage_history',
};

// Pass types
export const PASS_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

// Pass tiers
export const PASS_TIERS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  UNLIMITED: 'unlimited',
};

// Pass definitions
export const PASS_CATALOG = [
  // Weekly Passes
  {
    id: 'weekly-basic',
    name: 'Weekly Basic',
    type: PASS_TYPES.WEEKLY,
    tier: PASS_TIERS.BASIC,
    duration: 7,
    price: 15,
    currency: 'USD',
    tripsIncluded: 10,
    maxDistance: 100, // km per trip
    classes: ['economy'],
    routes: 'local', // local routes only
    features: [
      '10 trips included',
      'Economy class only',
      'Local routes (up to 100km)',
      'Valid for 7 days',
    ],
    savings: '20% vs single tickets',
  },
  {
    id: 'weekly-standard',
    name: 'Weekly Commuter',
    type: PASS_TYPES.WEEKLY,
    tier: PASS_TIERS.STANDARD,
    duration: 7,
    price: 35,
    currency: 'USD',
    tripsIncluded: 14,
    maxDistance: 500,
    classes: ['economy', 'business'],
    routes: 'regional',
    features: [
      '14 trips included',
      'Economy & Business class',
      'Regional routes (up to 500km)',
      'Priority boarding',
      'Valid for 7 days',
    ],
    savings: '30% vs single tickets',
    popular: true,
  },
  {
    id: 'weekly-premium',
    name: 'Weekly Premium',
    type: PASS_TYPES.WEEKLY,
    tier: PASS_TIERS.PREMIUM,
    duration: 7,
    price: 75,
    currency: 'USD',
    tripsIncluded: -1, // unlimited
    maxDistance: -1, // unlimited
    classes: ['economy', 'business', 'first'],
    routes: 'all',
    features: [
      'Unlimited trips',
      'All classes including First',
      'All routes',
      'Lounge access',
      'Priority boarding',
      'Valid for 7 days',
    ],
    savings: '40% vs single tickets',
  },
  
  // Monthly Passes
  {
    id: 'monthly-basic',
    name: 'Monthly Basic',
    type: PASS_TYPES.MONTHLY,
    tier: PASS_TIERS.BASIC,
    duration: 30,
    price: 45,
    currency: 'USD',
    tripsIncluded: 40,
    maxDistance: 100,
    classes: ['economy'],
    routes: 'local',
    features: [
      '40 trips included',
      'Economy class only',
      'Local routes (up to 100km)',
      'Valid for 30 days',
    ],
    savings: '25% vs single tickets',
  },
  {
    id: 'monthly-commuter',
    name: 'Monthly Commuter',
    type: PASS_TYPES.MONTHLY,
    tier: PASS_TIERS.STANDARD,
    duration: 30,
    price: 120,
    currency: 'USD',
    tripsIncluded: 60,
    maxDistance: 500,
    classes: ['economy', 'business'],
    routes: 'regional',
    features: [
      '60 trips included',
      'Economy & Business class',
      'Regional routes (up to 500km)',
      'Priority boarding',
      '10% off additional trips',
      'Valid for 30 days',
    ],
    savings: '35% vs single tickets',
    popular: true,
  },
  {
    id: 'monthly-unlimited',
    name: 'Monthly Unlimited',
    type: PASS_TYPES.MONTHLY,
    tier: PASS_TIERS.UNLIMITED,
    duration: 30,
    price: 250,
    currency: 'USD',
    tripsIncluded: -1,
    maxDistance: -1,
    classes: ['economy', 'business', 'first'],
    routes: 'all',
    features: [
      'Unlimited trips',
      'All classes including First',
      'All routes across Africa',
      'Lounge access',
      'Priority boarding',
      'Free seat selection',
      'Flexible rebooking',
      'Valid for 30 days',
    ],
    savings: '50% vs single tickets',
    bestValue: true,
  },
  
  // Student Passes
  {
    id: 'monthly-student',
    name: 'Student Monthly',
    type: PASS_TYPES.MONTHLY,
    tier: PASS_TIERS.STANDARD,
    duration: 30,
    price: 60,
    currency: 'USD',
    tripsIncluded: 60,
    maxDistance: 500,
    classes: ['economy', 'business'],
    routes: 'regional',
    requiresVerification: true,
    verificationTypes: ['student_id', 'enrollment_letter'],
    features: [
      '60 trips included',
      'Economy & Business class',
      'Regional routes',
      '50% student discount',
      'Valid student ID required',
      'Valid for 30 days',
    ],
    savings: '50% student discount',
    studentOnly: true,
  },
];

/**
 * Get all available passes
 */
export const getAvailablePasses = (filters = {}) => {
  let passes = [...PASS_CATALOG];
  
  if (filters.type) {
    passes = passes.filter(p => p.type === filters.type);
  }
  
  if (filters.tier) {
    passes = passes.filter(p => p.tier === filters.tier);
  }
  
  if (filters.maxPrice) {
    passes = passes.filter(p => p.price <= filters.maxPrice);
  }
  
  if (filters.includeStudentPasses === false) {
    passes = passes.filter(p => !p.studentOnly);
  }
  
  return passes;
};

/**
 * Get user's active passes
 */
export const getActivePasses = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PASSES);
    const passes = data ? JSON.parse(data) : [];
    
    const now = new Date();
    return passes.filter(pass => {
      const expiryDate = new Date(pass.expiresAt);
      return expiryDate > now && pass.status === 'active';
    });
  } catch (error) {
    console.error('Failed to get passes:', error);
    return [];
  }
};

/**
 * Get all user passes (including expired)
 */
export const getAllPasses = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PASSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get passes:', error);
    return [];
  }
};

/**
 * Purchase a pass
 */
export const purchasePass = async (passId, paymentMethod = 'wallet') => {
  const passCatalog = PASS_CATALOG.find(p => p.id === passId);
  
  if (!passCatalog) {
    throw new Error('Pass not found');
  }
  
  // Check wallet balance if paying with wallet
  if (paymentMethod === 'wallet') {
    const hasBalance = await hasSufficientBalance(passCatalog.price);
    if (!hasBalance) {
      throw new Error('Insufficient wallet balance');
    }
    
    // Deduct from wallet
    await deductFromWallet(passCatalog.price, `Pass purchase: ${passCatalog.name}`, 'pass_purchase');
  }
  
  // Create pass
  const now = new Date();
  const expiresAt = new Date(now.getTime() + passCatalog.duration * 24 * 60 * 60 * 1000);
  
  const newPass = {
    id: `PASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    passTypeId: passCatalog.id,
    name: passCatalog.name,
    type: passCatalog.type,
    tier: passCatalog.tier,
    price: passCatalog.price,
    currency: passCatalog.currency,
    
    // Usage tracking
    tripsIncluded: passCatalog.tripsIncluded,
    tripsUsed: 0,
    tripsRemaining: passCatalog.tripsIncluded === -1 ? 'unlimited' : passCatalog.tripsIncluded,
    
    // Validity
    maxDistance: passCatalog.maxDistance,
    classes: passCatalog.classes,
    routes: passCatalog.routes,
    
    // Dates
    purchasedAt: now.toISOString(),
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    
    // Status
    status: 'active',
    paymentMethod,
  };
  
  // Save pass
  const passes = await getAllPasses();
  passes.unshift(newPass);
  await AsyncStorage.setItem(KEYS.PASSES, JSON.stringify(passes));
  
  return newPass;
};

/**
 * Use a pass for a trip
 */
export const usePass = async (passId, tripDetails) => {
  const passes = await getAllPasses();
  const passIndex = passes.findIndex(p => p.id === passId);
  
  if (passIndex === -1) {
    throw new Error('Pass not found');
  }
  
  const pass = passes[passIndex];
  
  // Check if pass is still valid
  if (new Date(pass.expiresAt) < new Date()) {
    throw new Error('Pass has expired');
  }
  
  if (pass.status !== 'active') {
    throw new Error('Pass is not active');
  }
  
  // Check trip limits
  if (pass.tripsIncluded !== -1 && pass.tripsUsed >= pass.tripsIncluded) {
    throw new Error('No trips remaining on this pass');
  }
  
  // Check distance limit
  if (pass.maxDistance !== -1 && tripDetails.distance > pass.maxDistance) {
    throw new Error(`Trip distance exceeds pass limit of ${pass.maxDistance}km`);
  }
  
  // Check class
  if (!pass.classes.includes(tripDetails.class)) {
    throw new Error(`Pass does not cover ${tripDetails.class} class`);
  }
  
  // Update pass usage
  pass.tripsUsed += 1;
  if (pass.tripsIncluded !== -1) {
    pass.tripsRemaining = pass.tripsIncluded - pass.tripsUsed;
  }
  
  passes[passIndex] = pass;
  await AsyncStorage.setItem(KEYS.PASSES, JSON.stringify(passes));
  
  // Record usage
  await recordPassUsage(passId, tripDetails);
  
  return pass;
};

/**
 * Record pass usage history
 */
const recordPassUsage = async (passId, tripDetails) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PASS_USAGE);
    const usage = data ? JSON.parse(data) : [];
    
    usage.unshift({
      id: `USE-${Date.now()}`,
      passId,
      ...tripDetails,
      usedAt: new Date().toISOString(),
    });
    
    // Keep last 200 records
    if (usage.length > 200) {
      usage.pop();
    }
    
    await AsyncStorage.setItem(KEYS.PASS_USAGE, JSON.stringify(usage));
  } catch (error) {
    console.error('Failed to record pass usage:', error);
  }
};

/**
 * Get pass usage history
 */
export const getPassUsageHistory = async (passId = null, limit = 20) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PASS_USAGE);
    let usage = data ? JSON.parse(data) : [];
    
    if (passId) {
      usage = usage.filter(u => u.passId === passId);
    }
    
    return usage.slice(0, limit);
  } catch (error) {
    console.error('Failed to get pass usage:', error);
    return [];
  }
};

/**
 * Check if user has valid pass for a trip
 */
export const hasValidPassForTrip = async (tripDetails) => {
  const activePasses = await getActivePasses();
  
  for (const pass of activePasses) {
    // Check trips remaining
    if (pass.tripsIncluded !== -1 && pass.tripsUsed >= pass.tripsIncluded) {
      continue;
    }
    
    // Check distance
    if (pass.maxDistance !== -1 && tripDetails.distance > pass.maxDistance) {
      continue;
    }
    
    // Check class
    if (!pass.classes.includes(tripDetails.class)) {
      continue;
    }
    
    return { hasPass: true, pass };
  }
  
  return { hasPass: false, pass: null };
};

/**
 * Get pass summary for display
 */
export const getPassSummary = async () => {
  const activePasses = await getActivePasses();
  
  if (activePasses.length === 0) {
    return {
      hasActivePass: false,
      message: 'No active pass',
    };
  }
  
  const primaryPass = activePasses[0];
  const expiresAt = new Date(primaryPass.expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
  
  return {
    hasActivePass: true,
    passName: primaryPass.name,
    passType: primaryPass.type,
    tripsRemaining: primaryPass.tripsRemaining,
    daysRemaining,
    expiresAt: primaryPass.expiresAt,
    totalPasses: activePasses.length,
  };
};

/**
 * Cancel/deactivate a pass
 */
export const cancelPass = async (passId, reason = '') => {
  const passes = await getAllPasses();
  const passIndex = passes.findIndex(p => p.id === passId);
  
  if (passIndex === -1) {
    throw new Error('Pass not found');
  }
  
  passes[passIndex].status = 'cancelled';
  passes[passIndex].cancelledAt = new Date().toISOString();
  passes[passIndex].cancellationReason = reason;
  
  await AsyncStorage.setItem(KEYS.PASSES, JSON.stringify(passes));
  
  return passes[passIndex];
};

export default {
  PASS_TYPES,
  PASS_TIERS,
  PASS_CATALOG,
  getAvailablePasses,
  getActivePasses,
  getAllPasses,
  purchasePass,
  usePass,
  getPassUsageHistory,
  hasValidPassForTrip,
  getPassSummary,
  cancelPass,
};
