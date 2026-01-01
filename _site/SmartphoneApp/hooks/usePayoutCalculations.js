import { useMemo } from 'react';
import { calculateCommissionRevenue } from '../utils/commissionCalculator';

/**
 * Optimized Payout Calculations Hook
 * 
 * Uses useMemo to optimize projections calculation
 * Provides real-time reconciliation for TAZARA/ZRL accountants
 * 
 * Trust Layer: Separates
 * - Net Railway Revenue (theirs)
 * - Sentinel Service Fees (ours)
 * - Mobile Money Taxes (government)
 */
export const usePayoutCalculations = (subscribers, subscriptionMRR) => {
  // Memoize commission calculations
  const commissionData = useMemo(() => {
    return calculateCommissionRevenue(subscribers);
  }, [
    subscribers.traderSubs,
    subscribers.touristSubs,
    subscribers.domesticSubs,
    subscribers.commuterSubs,
  ]);

  // Memoize payout calculations
  const payoutData = useMemo(() => {
    const commissionRevenue = commissionData.totalCommission;
    const totalSales = commissionData.totalSales;

    // Railway Payout: 90% of ticket sales (they keep 90%, we take 10%)
    const railwayPayout = totalSales * 0.90;

    // Sentinel Earnings: Subscriptions + 10% commission
    const sentinelEarnings = subscriptionMRR + commissionRevenue;

    // Tax Withholding: 16% VAT (ZRA/TRA simulation)
    // In Zambia: 16% VAT on services
    // In Tanzania: 18% VAT on services
    const zambiaVAT = 0.16;
    const tanzaniaVAT = 0.18;
    const blendedVAT = 0.16; // Using Zambia rate as primary

    const taxWithholding = sentinelEarnings * blendedVAT;

    // Net amounts after tax
    const sentinelNetEarnings = sentinelEarnings - taxWithholding;
    const railwayNetPayout = railwayPayout;

    // Total volume (gross ticket sales)
    const totalVolume = totalSales;

    // Breakdown by segment
    const segmentBreakdown = {
      traders: {
        grossSales: commissionData.breakdown.traders.sales,
        commission: commissionData.breakdown.traders.commission,
        railwayNet: commissionData.breakdown.traders.sales * 0.90,
        bookings: commissionData.breakdown.traders.bookings,
      },
      tourists: {
        grossSales: commissionData.breakdown.tourists.sales,
        commission: commissionData.breakdown.tourists.commission,
        railwayNet: commissionData.breakdown.tourists.sales * 0.90,
        bookings: commissionData.breakdown.tourists.bookings,
      },
      domestic: {
        grossSales: commissionData.breakdown.domestic.sales,
        commission: commissionData.breakdown.domestic.commission,
        railwayNet: commissionData.breakdown.domestic.sales * 0.90,
        bookings: commissionData.breakdown.domestic.bookings,
      },
      commuters: {
        grossSales: commissionData.breakdown.commuters.sales,
        commission: commissionData.breakdown.commuters.commission,
        railwayNet: commissionData.breakdown.commuters.sales * 0.90,
        bookings: commissionData.breakdown.commuters.bookings,
      },
    };

    return {
      // Top-level metrics
      totalVolume,
      railwayPayout,
      sentinelEarnings,
      taxWithholding,
      sentinelNetEarnings,
      railwayNetPayout,

      // Revenue breakdown
      subscriptionRevenue: subscriptionMRR,
      commissionRevenue,
      totalSales,

      // Segment breakdown
      segmentBreakdown,

      // Percentages
      railwayShare: (railwayPayout / totalVolume) * 100,
      sentinelShare: (commissionRevenue / totalVolume) * 100,
      taxRate: blendedVAT * 100,

      // Settlement info
      settlementCycle: 'Weekly (Friday)',
      nextSettlement: getNextFriday(),
    };
  }, [commissionData, subscriptionMRR]);

  // Memoize reconciliation table data
  const reconciliationData = useMemo(() => {
    return [
      {
        source: 'Small-Scale Traders',
        icon: '💼',
        subscribers: subscribers.traderSubs,
        bookings: payoutData.segmentBreakdown.traders.bookings,
        grossSales: payoutData.segmentBreakdown.traders.grossSales,
        commission: payoutData.segmentBreakdown.traders.commission,
        railwayNet: payoutData.segmentBreakdown.traders.railwayNet,
      },
      {
        source: 'International Tourists',
        icon: '✈️',
        subscribers: subscribers.touristSubs,
        bookings: payoutData.segmentBreakdown.tourists.bookings,
        grossSales: payoutData.segmentBreakdown.tourists.grossSales,
        commission: payoutData.segmentBreakdown.tourists.commission,
        railwayNet: payoutData.segmentBreakdown.tourists.railwayNet,
      },
      {
        source: 'Domestic Leisure',
        icon: '🎫',
        subscribers: subscribers.domesticSubs,
        bookings: payoutData.segmentBreakdown.domestic.bookings,
        grossSales: payoutData.segmentBreakdown.domestic.grossSales,
        commission: payoutData.segmentBreakdown.domestic.commission,
        railwayNet: payoutData.segmentBreakdown.domestic.railwayNet,
      },
      {
        source: 'Daily Commuters',
        icon: '🚌',
        subscribers: subscribers.commuterSubs,
        bookings: payoutData.segmentBreakdown.commuters.bookings,
        grossSales: payoutData.segmentBreakdown.commuters.grossSales,
        commission: payoutData.segmentBreakdown.commuters.commission,
        railwayNet: payoutData.segmentBreakdown.commuters.railwayNet,
      },
    ];
  }, [payoutData, subscribers]);

  return {
    payoutData,
    reconciliationData,
    commissionData,
  };
};

/**
 * Get next Friday for settlement
 */
function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + daysUntilFriday);
  return nextFriday.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default usePayoutCalculations;
