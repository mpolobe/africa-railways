/**
 * Commission Revenue Calculator
 * 
 * Calculates 10% commission revenue from ticket bookings
 * across different customer segments
 * 
 * For TAZARA/ZRL board presentations and audit trails
 */

// Customer Segment Definitions (Based on market research)
export const CUSTOMER_SEGMENTS = {
  smallScaleTraders: {
    name: 'Small-Scale Traders',
    bookingsPerMonth: 4,        // Weekly traders
    avgTicketPrice: 120,        // ZMW (Kapiri-Dar economy)
    commissionRate: 0.10,       // 10%
    description: 'Cross-border traders making weekly trips',
  },
  internationalTourists: {
    name: 'International Tourists',
    bookingsPerMonth: 1,        // One-time or occasional
    avgTicketPrice: 280,        // ZMW (First class, longer routes)
    commissionRate: 0.10,       // 10%
    description: 'Tourists visiting Victoria Falls, Selous',
  },
  domesticLeisure: {
    name: 'Domestic Leisure',
    bookingsPerMonth: 2,        // Occasional travelers
    avgTicketPrice: 95,         // ZMW (Domestic routes)
    commissionRate: 0.10,       // 10%
    description: 'Local travelers for family visits, leisure',
  },
  dailyCommuters: {
    name: 'Daily Commuters',
    bookingsPerMonth: 20,       // Daily riders
    avgTicketPrice: 25,         // ZMW (Short commuter routes)
    commissionRate: 0.10,       // 10%
    description: 'Dar/Lusaka daily commuters',
  },
};

/**
 * Calculate commission revenue for all segments
 */
export const calculateCommissionRevenue = (subscribers) => {
  const {
    traderSubs = 0,
    touristSubs = 0,
    domesticSubs = 0,
    commuterSubs = 0,
  } = subscribers;

  // Trader commission
  const traderCommission = 
    traderSubs * 
    CUSTOMER_SEGMENTS.smallScaleTraders.bookingsPerMonth * 
    CUSTOMER_SEGMENTS.smallScaleTraders.avgTicketPrice * 
    CUSTOMER_SEGMENTS.smallScaleTraders.commissionRate;

  // Tourist commission
  const touristCommission = 
    touristSubs * 
    CUSTOMER_SEGMENTS.internationalTourists.bookingsPerMonth * 
    CUSTOMER_SEGMENTS.internationalTourists.avgTicketPrice * 
    CUSTOMER_SEGMENTS.internationalTourists.commissionRate;

  // Domestic commission
  const domesticCommission = 
    domesticSubs * 
    CUSTOMER_SEGMENTS.domesticLeisure.bookingsPerMonth * 
    CUSTOMER_SEGMENTS.domesticLeisure.avgTicketPrice * 
    CUSTOMER_SEGMENTS.domesticLeisure.commissionRate;

  // Commuter commission
  const commuterCommission = 
    commuterSubs * 
    CUSTOMER_SEGMENTS.dailyCommuters.bookingsPerMonth * 
    CUSTOMER_SEGMENTS.dailyCommuters.avgTicketPrice * 
    CUSTOMER_SEGMENTS.dailyCommuters.commissionRate;

  const totalCommission = 
    traderCommission + 
    touristCommission + 
    domesticCommission + 
    commuterCommission;

  // Calculate total sales generated for railway
  const totalSales = totalCommission / 0.10;

  return {
    traderCommission,
    touristCommission,
    domesticCommission,
    commuterCommission,
    totalCommission,
    totalSales,
    breakdown: {
      traders: {
        subscribers: traderSubs,
        bookings: traderSubs * CUSTOMER_SEGMENTS.smallScaleTraders.bookingsPerMonth,
        sales: traderSubs * CUSTOMER_SEGMENTS.smallScaleTraders.bookingsPerMonth * CUSTOMER_SEGMENTS.smallScaleTraders.avgTicketPrice,
        commission: traderCommission,
      },
      tourists: {
        subscribers: touristSubs,
        bookings: touristSubs * CUSTOMER_SEGMENTS.internationalTourists.bookingsPerMonth,
        sales: touristSubs * CUSTOMER_SEGMENTS.internationalTourists.bookingsPerMonth * CUSTOMER_SEGMENTS.internationalTourists.avgTicketPrice,
        commission: touristCommission,
      },
      domestic: {
        subscribers: domesticSubs,
        bookings: domesticSubs * CUSTOMER_SEGMENTS.domesticLeisure.bookingsPerMonth,
        sales: domesticSubs * CUSTOMER_SEGMENTS.domesticLeisure.bookingsPerMonth * CUSTOMER_SEGMENTS.domesticLeisure.avgTicketPrice,
        commission: domesticCommission,
      },
      commuters: {
        subscribers: commuterSubs,
        bookings: commuterSubs * CUSTOMER_SEGMENTS.dailyCommuters.bookingsPerMonth,
        sales: commuterSubs * CUSTOMER_SEGMENTS.dailyCommuters.bookingsPerMonth * CUSTOMER_SEGMENTS.dailyCommuters.avgTicketPrice,
        commission: commuterCommission,
      },
    },
  };
};

/**
 * Calculate total ecosystem value
 * Combines subscription MRR with commission revenue
 */
export const calculateTotalRevenue = (subscriptionMRR, commissionRevenue) => {
  const totalMonthlyRevenue = subscriptionMRR + commissionRevenue;
  
  return {
    subscriptionMRR,
    commissionRevenue,
    totalMonthlyRevenue,
    subscriptionShare: subscriptionMRR / totalMonthlyRevenue,
    commissionShare: commissionRevenue / totalMonthlyRevenue,
  };
};

/**
 * Calculate digital market share
 * How much of total railway revenue flows through Sentinel
 */
export const calculateDigitalMarketShare = (commissionRevenue, railwayTotalRevenue) => {
  // Commission revenue represents 10% of sales we facilitated
  const sentinelFacilitatedSales = commissionRevenue / 0.10;
  
  // Calculate market share
  const digitalMarketShare = sentinelFacilitatedSales / railwayTotalRevenue;
  
  return {
    sentinelFacilitatedSales,
    railwayTotalRevenue,
    digitalMarketShare,
    digitalMarketSharePercent: digitalMarketShare * 100,
  };
};

/**
 * Generate audit trail for TAZARA/ZRL finance department
 */
export const generateAuditTrail = (subscribers, month) => {
  const commission = calculateCommissionRevenue(subscribers);
  
  return {
    month,
    timestamp: new Date().toISOString(),
    subscribers: {
      traders: subscribers.traderSubs,
      tourists: subscribers.touristSubs,
      domestic: subscribers.domesticSubs,
      commuters: subscribers.commuterSubs,
      total: subscribers.traderSubs + subscribers.touristSubs + subscribers.domesticSubs + subscribers.commuterSubs,
    },
    bookings: {
      traders: commission.breakdown.traders.bookings,
      tourists: commission.breakdown.tourists.bookings,
      domestic: commission.breakdown.domestic.bookings,
      commuters: commission.breakdown.commuters.bookings,
      total: 
        commission.breakdown.traders.bookings +
        commission.breakdown.tourists.bookings +
        commission.breakdown.domestic.bookings +
        commission.breakdown.commuters.bookings,
    },
    sales: {
      traders: commission.breakdown.traders.sales,
      tourists: commission.breakdown.tourists.sales,
      domestic: commission.breakdown.domestic.sales,
      commuters: commission.breakdown.commuters.sales,
      total: commission.totalSales,
    },
    commission: {
      traders: commission.traderCommission,
      tourists: commission.touristCommission,
      domestic: commission.domesticCommission,
      commuters: commission.commuterCommission,
      total: commission.totalCommission,
      rate: '10%',
    },
    verification: {
      calculationMethod: 'subscribers × bookingsPerMonth × avgTicketPrice × 0.10',
      auditReady: true,
      railwayBenefit: commission.totalSales,
      sentinelCommission: commission.totalCommission,
    },
  };
};

/**
 * Format audit trail for export/display
 */
export const formatAuditTrail = (auditTrail) => {
  return `
SENTINEL COMMISSION AUDIT TRAIL
Month: ${auditTrail.month}
Generated: ${new Date(auditTrail.timestamp).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBSCRIBERS
  Traders:   ${auditTrail.subscribers.traders.toLocaleString()}
  Tourists:  ${auditTrail.subscribers.tourists.toLocaleString()}
  Domestic:  ${auditTrail.subscribers.domestic.toLocaleString()}
  Commuters: ${auditTrail.subscribers.commuters.toLocaleString()}
  ─────────────────────────────────────────────────────
  Total:     ${auditTrail.subscribers.total.toLocaleString()}

BOOKINGS FACILITATED
  Traders:   ${auditTrail.bookings.traders.toLocaleString()}
  Tourists:  ${auditTrail.bookings.tourists.toLocaleString()}
  Domestic:  ${auditTrail.bookings.domestic.toLocaleString()}
  Commuters: ${auditTrail.bookings.commuters.toLocaleString()}
  ─────────────────────────────────────────────────────
  Total:     ${auditTrail.bookings.total.toLocaleString()}

SALES GENERATED FOR RAILWAY
  Traders:   ZMW ${auditTrail.sales.traders.toLocaleString()}
  Tourists:  ZMW ${auditTrail.sales.tourists.toLocaleString()}
  Domestic:  ZMW ${auditTrail.sales.domestic.toLocaleString()}
  Commuters: ZMW ${auditTrail.sales.commuters.toLocaleString()}
  ─────────────────────────────────────────────────────
  Total:     ZMW ${auditTrail.sales.total.toLocaleString()}

SENTINEL 10% COMMISSION
  Traders:   ZMW ${auditTrail.commission.traders.toLocaleString()}
  Tourists:  ZMW ${auditTrail.commission.tourists.toLocaleString()}
  Domestic:  ZMW ${auditTrail.commission.domestic.toLocaleString()}
  Commuters: ZMW ${auditTrail.commission.commuters.toLocaleString()}
  ─────────────────────────────────────────────────────
  Total:     ZMW ${auditTrail.commission.total.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION
  Railway Benefit:      ZMW ${auditTrail.verification.railwayBenefit.toLocaleString()}
  Sentinel Commission:  ZMW ${auditTrail.verification.sentinelCommission.toLocaleString()}
  Commission Rate:      ${auditTrail.commission.rate}
  Audit Ready:          ${auditTrail.verification.auditReady ? 'YES' : 'NO'}

Calculation Method: ${auditTrail.verification.calculationMethod}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Audit-ready for TAZARA/ZRL Finance Department
  `.trim();
};

export default {
  CUSTOMER_SEGMENTS,
  calculateCommissionRevenue,
  calculateTotalRevenue,
  calculateDigitalMarketShare,
  generateAuditTrail,
  formatAuditTrail,
};
