/**
 * Operator Revenue Calculator
 * 
 * Calculates revenue share for each operator based on distance traveled
 * on their network when a booking spans multiple operators.
 * 
 * Example: Kapiri Mposhi (Zambia) → Dar es Salaam (Tanzania)
 * - ZRL operates Zambian segment
 * - TAZARA operates cross-border segment
 * - TRC may operate Tanzanian segment
 * 
 * Revenue is split proportionally by distance on each operator's network.
 */

// Route segments with operator and distance data
export const ROUTE_SEGMENTS = {
  // TAZARA Route: Kapiri Mposhi to Dar es Salaam (1,860 km total)
  'kapiri-dar': {
    totalDistance: 1860,
    currency: 'USD',
    segments: [
      {
        operatorId: 'zrl',
        operatorName: 'Zambia Railways Limited',
        from: 'Kapiri Mposhi',
        to: 'Nakonde Border',
        distance: 850,
        country: 'Zambia',
      },
      {
        operatorId: 'tazara',
        operatorName: 'TAZARA',
        from: 'Nakonde Border',
        to: 'Dar es Salaam',
        distance: 1010,
        country: 'Tanzania',
      },
    ],
  },
  
  // Lusaka to Livingstone (ZRL only)
  'lusaka-livingstone': {
    totalDistance: 474,
    currency: 'USD',
    segments: [
      {
        operatorId: 'zrl',
        operatorName: 'Zambia Railways Limited',
        from: 'Lusaka',
        to: 'Livingstone',
        distance: 474,
        country: 'Zambia',
      },
    ],
  },
  
  // Lusaka to Kitwe (ZRL only)
  'lusaka-kitwe': {
    totalDistance: 320,
    currency: 'USD',
    segments: [
      {
        operatorId: 'zrl',
        operatorName: 'Zambia Railways Limited',
        from: 'Lusaka',
        to: 'Kitwe',
        distance: 320,
        country: 'Zambia',
      },
    ],
  },
  
  // Nairobi to Mombasa (Kenya Railways SGR)
  'nairobi-mombasa': {
    totalDistance: 472,
    currency: 'USD',
    segments: [
      {
        operatorId: 'krc',
        operatorName: 'Kenya Railways Corporation',
        from: 'Nairobi',
        to: 'Mombasa',
        distance: 472,
        country: 'Kenya',
      },
    ],
  },
  
  // Dar es Salaam to Mwanza (TRC)
  'dar-mwanza': {
    totalDistance: 1219,
    currency: 'USD',
    segments: [
      {
        operatorId: 'trc',
        operatorName: 'Tanzania Railways Corporation',
        from: 'Dar es Salaam',
        to: 'Mwanza',
        distance: 1219,
        country: 'Tanzania',
      },
    ],
  },
  
  // Lobito Corridor: Lobito to Kolwezi (multi-operator)
  'lobito-kolwezi': {
    totalDistance: 1344,
    currency: 'USD',
    segments: [
      {
        operatorId: 'cfl',
        operatorName: 'Caminho de Ferro de Luanda',
        from: 'Lobito',
        to: 'Luau Border',
        distance: 1067,
        country: 'Angola',
      },
      {
        operatorId: 'sncc',
        operatorName: 'SNCC',
        from: 'Luau Border',
        to: 'Kolwezi',
        distance: 277,
        country: 'DRC',
      },
    ],
  },
};

// Commission rate taken by Africa Railways platform
const PLATFORM_COMMISSION_RATE = 0.10; // 10%

/**
 * Calculate revenue share for each operator on a route
 * 
 * @param {string} routeId - Route identifier (e.g., 'kapiri-dar')
 * @param {number} ticketPrice - Total ticket price in USD
 * @param {string} ticketClass - 'economy', 'business', or 'first'
 * @returns {Object} Revenue breakdown by operator
 */
export const calculateOperatorRevenue = (routeId, ticketPrice, ticketClass = 'economy') => {
  const route = ROUTE_SEGMENTS[routeId];
  
  if (!route) {
    throw new Error(`Unknown route: ${routeId}`);
  }
  
  const { totalDistance, segments } = route;
  
  // Platform takes 10% commission
  const platformCommission = ticketPrice * PLATFORM_COMMISSION_RATE;
  const netRevenue = ticketPrice - platformCommission;
  
  // Calculate revenue per kilometer
  const revenuePerKm = netRevenue / totalDistance;
  
  // Calculate each operator's share based on distance
  const operatorShares = segments.map(segment => {
    const share = segment.distance / totalDistance;
    const revenue = netRevenue * share;
    const revenuePerKmForSegment = revenue / segment.distance;
    
    return {
      operatorId: segment.operatorId,
      operatorName: segment.operatorName,
      country: segment.country,
      from: segment.from,
      to: segment.to,
      distance: segment.distance,
      distanceShare: share,
      distanceSharePercent: (share * 100).toFixed(1),
      revenue: revenue,
      revenueFormatted: `$${revenue.toFixed(2)}`,
      revenuePerKm: revenuePerKmForSegment,
    };
  });
  
  return {
    routeId,
    ticketPrice,
    ticketClass,
    totalDistance,
    platformCommission,
    platformCommissionPercent: PLATFORM_COMMISSION_RATE * 100,
    netRevenueToOperators: netRevenue,
    revenuePerKm,
    operatorShares,
    summary: {
      totalOperators: segments.length,
      countries: [...new Set(segments.map(s => s.country))],
      settlementCurrency: route.currency,
    },
  };
};

/**
 * Calculate revenue for a booking with multiple tickets
 * 
 * @param {Array} bookings - Array of {routeId, ticketPrice, quantity, ticketClass}
 * @returns {Object} Aggregated revenue by operator
 */
export const calculateBatchRevenue = (bookings) => {
  const operatorTotals = {};
  let totalTicketRevenue = 0;
  let totalPlatformCommission = 0;
  let totalOperatorRevenue = 0;
  
  bookings.forEach(booking => {
    const { routeId, ticketPrice, quantity = 1, ticketClass = 'economy' } = booking;
    
    for (let i = 0; i < quantity; i++) {
      const result = calculateOperatorRevenue(routeId, ticketPrice, ticketClass);
      
      totalTicketRevenue += ticketPrice;
      totalPlatformCommission += result.platformCommission;
      totalOperatorRevenue += result.netRevenueToOperators;
      
      result.operatorShares.forEach(share => {
        if (!operatorTotals[share.operatorId]) {
          operatorTotals[share.operatorId] = {
            operatorId: share.operatorId,
            operatorName: share.operatorName,
            country: share.country,
            totalRevenue: 0,
            totalDistance: 0,
            bookingCount: 0,
          };
        }
        
        operatorTotals[share.operatorId].totalRevenue += share.revenue;
        operatorTotals[share.operatorId].totalDistance += share.distance;
        operatorTotals[share.operatorId].bookingCount += 1;
      });
    }
  });
  
  return {
    totalTicketRevenue,
    totalPlatformCommission,
    totalOperatorRevenue,
    operatorBreakdown: Object.values(operatorTotals).map(op => ({
      ...op,
      totalRevenueFormatted: `$${op.totalRevenue.toFixed(2)}`,
      averageRevenuePerBooking: op.totalRevenue / op.bookingCount,
    })),
    summary: {
      bookingCount: bookings.reduce((sum, b) => sum + (b.quantity || 1), 0),
      uniqueOperators: Object.keys(operatorTotals).length,
      platformCommissionRate: `${PLATFORM_COMMISSION_RATE * 100}%`,
    },
  };
};

/**
 * Generate settlement report for an operator
 * 
 * @param {string} operatorId - Operator ID
 * @param {Array} bookings - Array of bookings involving this operator
 * @param {string} period - Settlement period (e.g., 'Week 2, January 2026')
 * @returns {Object} Settlement report
 */
export const generateOperatorSettlement = (operatorId, bookings, period) => {
  const operatorBookings = [];
  let totalOwed = 0;
  let totalDistance = 0;
  
  bookings.forEach(booking => {
    const result = calculateOperatorRevenue(booking.routeId, booking.ticketPrice, booking.ticketClass);
    const operatorShare = result.operatorShares.find(s => s.operatorId === operatorId);
    
    if (operatorShare) {
      operatorBookings.push({
        bookingId: booking.bookingId,
        route: `${operatorShare.from} → ${operatorShare.to}`,
        fullRoute: booking.routeId,
        ticketPrice: booking.ticketPrice,
        operatorRevenue: operatorShare.revenue,
        distance: operatorShare.distance,
        date: booking.date,
      });
      
      totalOwed += operatorShare.revenue;
      totalDistance += operatorShare.distance;
    }
  });
  
  return {
    operatorId,
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalBookings: operatorBookings.length,
      totalDistanceKm: totalDistance,
      totalOwed,
      totalOwedFormatted: `$${totalOwed.toFixed(2)}`,
      averagePerBooking: operatorBookings.length > 0 ? totalOwed / operatorBookings.length : 0,
      revenuePerKm: totalDistance > 0 ? totalOwed / totalDistance : 0,
    },
    bookings: operatorBookings,
    paymentDetails: {
      currency: 'USD',
      settlementMethod: 'Bank Transfer / Mobile Money',
      paymentTerms: 'Net 7 days from settlement date',
    },
  };
};

/**
 * Get route information with operator breakdown
 * 
 * @param {string} routeId - Route identifier
 * @returns {Object} Route details with operators
 */
export const getRouteInfo = (routeId) => {
  const route = ROUTE_SEGMENTS[routeId];
  
  if (!route) {
    return null;
  }
  
  return {
    routeId,
    totalDistance: route.totalDistance,
    currency: route.currency,
    operators: route.segments.map(s => ({
      id: s.operatorId,
      name: s.operatorName,
      country: s.country,
      segment: `${s.from} → ${s.to}`,
      distance: s.distance,
      distancePercent: ((s.distance / route.totalDistance) * 100).toFixed(1),
    })),
    isMultiOperator: route.segments.length > 1,
  };
};

/**
 * List all available routes
 * 
 * @returns {Array} List of routes with basic info
 */
export const listRoutes = () => {
  return Object.entries(ROUTE_SEGMENTS).map(([routeId, route]) => ({
    routeId,
    totalDistance: route.totalDistance,
    operatorCount: route.segments.length,
    operators: route.segments.map(s => s.operatorName),
    countries: [...new Set(route.segments.map(s => s.country))],
    from: route.segments[0].from,
    to: route.segments[route.segments.length - 1].to,
  }));
};

export default {
  ROUTE_SEGMENTS,
  calculateOperatorRevenue,
  calculateBatchRevenue,
  generateOperatorSettlement,
  getRouteInfo,
  listRoutes,
};
