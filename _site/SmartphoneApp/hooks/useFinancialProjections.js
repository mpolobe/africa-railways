import { useState, useEffect } from 'react';

/**
 * Financial Projections Hook
 * 
 * Based on real 2025 TAZARA/ZRL market data:
 * - TAZARA: $1.4B revitalization (Active Phase)
 * - ZRL: K100M modernization injection
 * - 12,000 passengers/week (fully booked 2 weeks advance)
 * - 9,000 daily commuters (Dar es Salaam)
 * 
 * Growth rates reflect 2025 revitalization surge
 */

// Real-World Market Constants (Dec 2025)
const MARKET_CONSTANTS = {
  // TAZARA Market
  TAZARA_ANNUAL_PASSENGERS: 1600000,
  TAZARA_WEEKLY_PASSENGERS: 12000, // Current capacity (fully booked)
  TAZARA_REVITALIZATION_BUDGET: 1400000000, // $1.4B USD
  
  // ZRL Market
  ZRL_MODERNIZATION_BUDGET: 100000000, // K100M ZMW
  ZRL_NETWORK_LENGTH: 1200, // km
  
  // Commuter Market
  DAR_DAILY_COMMUTERS: 9000,
  LUSAKA_DAILY_COMMUTERS: 3000, // Estimated
  
  // Trader Market
  CROSS_BORDER_TRADERS_WEEKLY: 5000,
  CROSS_BORDER_TRADERS_ANNUAL: 260000, // 5000 * 52 weeks
  
  // Total Addressable Market
  TOTAL_MARKET: 3400000, // 3.4M potential users
  
  // Market Dynamics
  BOOKING_ADVANCE_WEEKS: 2, // Fully booked 2 weeks in advance
  CAPACITY_UTILIZATION: 0.95, // 95% capacity (scarcity driver)
};

// Industry Standard Churn Rate for Transit Apps
const CHURN_RATE = 0.05; // 5% monthly churn

// Default Growth Assumptions (Based on 2025 Revitalization)
const DEFAULT_ASSUMPTIONS = {
  // Market Penetration Rates
  traderPenetration: 5,      // 5% of traders
  touristPenetration: 2,     // 2% of tourists  
  domesticPenetration: 3,    // 3% of domestic travelers
  commuterPenetration: 10,   // 10% of daily commuters
  
  // Plan Pricing (ZMW)
  traderPlan: 50,
  commuterPlan: 120,
  touristPlan: 250,
  perBookingFee: 15,
  
  // Monthly Growth Rates (%)
  // Reflect 2025 revitalization surge
  traderGrowth: 15,          // 15% - Cross-border trade increasing
  touristGrowth: 10,         // 10% - Victoria Falls tourism recovery
  domesticGrowth: 12,        // 12% - Local travel increasing
  commuterGrowth: 20,        // 20% - Dar/Lusaka modernization impact
  premiumGrowth: 15,         // 15% - Premium segment boosted by revitalization
  
  // Churn Rate
  churnRate: CHURN_RATE,
};

/**
 * Calculate next month's statistics with churn and growth
 */
const calculateNextMonth = (prevStats, assumptions) => {
  const churnRate = assumptions.churnRate || CHURN_RATE;
  
  return {
    month: prevStats.month + 1,
    
    // Trader segment: Cross-border traders
    traderSubs: Math.round(
      prevStats.traderSubs * (1 - churnRate) * (1 + assumptions.traderGrowth / 100)
    ),
    
    // Tourist segment: International visitors
    touristSubs: Math.round(
      prevStats.touristSubs * (1 - churnRate) * (1 + assumptions.touristGrowth / 100)
    ),
    
    // Domestic segment: Local travelers
    domesticSubs: Math.round(
      prevStats.domesticSubs * (1 - churnRate) * (1 + assumptions.domesticGrowth / 100)
    ),
    
    // Commuter segment: Daily riders
    // Boosted by 2025 Revitalization Projects (TAZARA $1.4B + ZRL K100M)
    commuterSubs: Math.round(
      prevStats.commuterSubs * (1 - churnRate) * (1 + assumptions.commuterGrowth / 100)
    ),
    
    // Premium segment: High-value users
    // 15% growth reflects modernization impact and scarcity-driven demand
    premiumSubs: Math.round(
      prevStats.premiumSubs * (1 - churnRate) * 1.15
    ),
  };
};

/**
 * Calculate initial subscriber base (Month 1)
 */
const calculateInitialSubscribers = (assumptions) => {
  return {
    month: 1,
    
    traderSubs: Math.round(
      MARKET_CONSTANTS.CROSS_BORDER_TRADERS_WEEKLY * 
      (assumptions.traderPenetration / 100)
    ),
    
    touristSubs: Math.round(
      (MARKET_CONSTANTS.TAZARA_ANNUAL_PASSENGERS * 0.3) * 
      (assumptions.touristPenetration / 100) / 12
    ),
    
    domesticSubs: Math.round(
      (MARKET_CONSTANTS.TAZARA_ANNUAL_PASSENGERS * 0.7) * 
      (assumptions.domesticPenetration / 100) / 12
    ),
    
    commuterSubs: Math.round(
      MARKET_CONSTANTS.DAR_DAILY_COMMUTERS * 
      (assumptions.commuterPenetration / 100)
    ),
    
    premiumSubs: Math.round(
      (MARKET_CONSTANTS.TAZARA_WEEKLY_PASSENGERS * 0.1) * 
      (assumptions.commuterPenetration / 100)
    ),
  };
};

/**
 * Calculate revenue for a given month
 */
const calculateRevenue = (stats, assumptions) => {
  const subscriptionRevenue = (
    (stats.traderSubs * assumptions.traderPlan) +
    (stats.touristSubs * assumptions.touristPlan) +
    (stats.domesticSubs * assumptions.traderPlan) +
    (stats.commuterSubs * assumptions.commuterPlan) +
    (stats.premiumSubs * assumptions.commuterPlan)
  );
  
  // Pay-per-use revenue (0.1% of total market)
  const payPerUseUsers = Math.round(MARKET_CONSTANTS.TOTAL_MARKET * 0.001);
  const payPerUseRevenue = payPerUseUsers * assumptions.perBookingFee;
  
  const totalRevenue = subscriptionRevenue + payPerUseRevenue;
  const totalSubscribers = (
    stats.traderSubs + 
    stats.touristSubs + 
    stats.domesticSubs + 
    stats.commuterSubs + 
    stats.premiumSubs
  );
  
  return {
    subscriptionRevenue,
    payPerUseRevenue,
    totalRevenue,
    totalSubscribers,
    arpu: totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0,
  };
};

/**
 * Main hook for financial projections
 */
export const useFinancialProjections = (customAssumptions = {}) => {
  const [assumptions, setAssumptions] = useState({
    ...DEFAULT_ASSUMPTIONS,
    ...customAssumptions,
  });
  
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateProjections();
  }, [assumptions]);

  const calculateProjections = () => {
    setLoading(true);
    
    const monthlyProjections = [];
    
    // Month 1: Initial subscribers
    let currentStats = calculateInitialSubscribers(assumptions);
    let currentRevenue = calculateRevenue(currentStats, assumptions);
    
    monthlyProjections.push({
      ...currentStats,
      ...currentRevenue,
    });
    
    // Months 2-12: Apply growth and churn
    for (let month = 2; month <= 12; month++) {
      currentStats = calculateNextMonth(currentStats, assumptions);
      currentRevenue = calculateRevenue(currentStats, assumptions);
      
      monthlyProjections.push({
        ...currentStats,
        ...currentRevenue,
      });
    }
    
    setProjections(monthlyProjections);
    setLoading(false);
  };

  const updateAssumptions = (newAssumptions) => {
    setAssumptions({
      ...assumptions,
      ...newAssumptions,
    });
  };

  const getMonthProjection = (month) => {
    return projections[month - 1] || null;
  };

  const getTotalRevenue = () => {
    return projections.reduce((sum, month) => sum + month.totalRevenue, 0);
  };

  const getAverageGrowthRate = () => {
    if (projections.length < 2) return 0;
    
    const firstMonth = projections[0].totalSubscribers;
    const lastMonth = projections[projections.length - 1].totalSubscribers;
    
    return ((lastMonth / firstMonth) ** (1 / (projections.length - 1)) - 1) * 100;
  };

  return {
    projections,
    assumptions,
    updateAssumptions,
    getMonthProjection,
    getTotalRevenue,
    getAverageGrowthRate,
    loading,
    marketConstants: MARKET_CONSTANTS,
  };
};

/**
 * Validation: Check if assumptions are realistic
 */
export const validateAssumptions = (assumptions) => {
  const warnings = [];
  const errors = [];
  
  // Check penetration rates
  if (assumptions.traderPenetration > 20) {
    warnings.push('Trader penetration >20% may be optimistic');
  }
  if (assumptions.commuterPenetration > 30) {
    warnings.push('Commuter penetration >30% may be optimistic');
  }
  
  // Check growth rates
  if (assumptions.traderGrowth > 30) {
    warnings.push('Trader growth >30%/month is very aggressive');
  }
  if (assumptions.commuterGrowth > 40) {
    warnings.push('Commuter growth >40%/month is very aggressive');
  }
  
  // Check pricing
  if (assumptions.traderPlan < 30 || assumptions.traderPlan > 100) {
    warnings.push('Trader plan pricing outside typical range (ZMW 30-100)');
  }
  if (assumptions.commuterPlan < 80 || assumptions.commuterPlan > 200) {
    warnings.push('Commuter plan pricing outside typical range (ZMW 80-200)');
  }
  
  // Check churn rate
  if (assumptions.churnRate > 0.15) {
    errors.push('Churn rate >15% is unsustainable');
  }
  if (assumptions.churnRate < 0.02) {
    warnings.push('Churn rate <2% is unrealistically low');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

/**
 * Export market constants for use in other components
 */
export { MARKET_CONSTANTS, DEFAULT_ASSUMPTIONS, CHURN_RATE };

export default useFinancialProjections;
