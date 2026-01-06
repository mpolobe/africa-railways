import { renderHook } from '@testing-library/react-native';
import { usePayoutCalculations } from '../hooks/usePayoutCalculations';

describe('usePayoutCalculations', () => {
  const mockSubscribers = {
    traderSubs: 100,
    touristSubs: 50,
    domesticSubs: 200,
    commuterSubs: 500,
  };

  const mockSubscriptionMRR = 10000;

  it('should calculate payout data correctly', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    expect(result.current.payoutData).toBeDefined();
    expect(result.current.payoutData.totalVolume).toBeGreaterThan(0);
    expect(result.current.payoutData.railwayPayout).toBeGreaterThan(0);
    expect(result.current.payoutData.sentinelEarnings).toBeGreaterThan(0);
  });

  it('should recalculate when subscribers change', () => {
    const { result, rerender } = renderHook(
      ({ subscribers, mrr }) => usePayoutCalculations(subscribers, mrr),
      {
        initialProps: {
          subscribers: mockSubscribers,
          mrr: mockSubscriptionMRR,
        },
      }
    );

    const initialTotalVolume = result.current.payoutData.totalVolume;

    // Update subscribers
    const updatedSubscribers = {
      ...mockSubscribers,
      traderSubs: 200, // Double trader subs
    };

    rerender({
      subscribers: updatedSubscribers,
      mrr: mockSubscriptionMRR,
    });

    // Total volume should increase
    expect(result.current.payoutData.totalVolume).toBeGreaterThan(
      initialTotalVolume
    );
  });

  it('should calculate railway payout as 90% of total sales', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    const { totalSales, railwayPayout } = result.current.payoutData;
    expect(railwayPayout).toBeCloseTo(totalSales * 0.9, 2);
  });

  it('should include subscription revenue in sentinel earnings', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    const { sentinelEarnings, commissionRevenue } = result.current.payoutData;
    expect(sentinelEarnings).toBeCloseTo(
      mockSubscriptionMRR + commissionRevenue,
      2
    );
  });

  it('should calculate tax withholding correctly', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    const { sentinelEarnings, taxWithholding } = result.current.payoutData;
    const expectedTax = sentinelEarnings * 0.16; // 16% VAT
    expect(taxWithholding).toBeCloseTo(expectedTax, 2);
  });

  it('should provide reconciliation data for all segments', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    expect(result.current.reconciliationData).toHaveLength(4);
    expect(result.current.reconciliationData[0].source).toBe(
      'Small-Scale Traders'
    );
    expect(result.current.reconciliationData[1].source).toBe(
      'International Tourists'
    );
    expect(result.current.reconciliationData[2].source).toBe(
      'Domestic Leisure'
    );
    expect(result.current.reconciliationData[3].source).toBe('Daily Commuters');
  });

  it('should handle zero subscribers gracefully', () => {
    const zeroSubscribers = {
      traderSubs: 0,
      touristSubs: 0,
      domesticSubs: 0,
      commuterSubs: 0,
    };

    const { result } = renderHook(() =>
      usePayoutCalculations(zeroSubscribers, mockSubscriptionMRR)
    );

    expect(result.current.payoutData.totalVolume).toBe(0);
    expect(result.current.payoutData.commissionRevenue).toBe(0);
    expect(result.current.payoutData.sentinelEarnings).toBe(mockSubscriptionMRR);
  });

  it('should memoize calculations to avoid unnecessary recalculations', () => {
    const { result, rerender } = renderHook(
      ({ subscribers, mrr }) => usePayoutCalculations(subscribers, mrr),
      {
        initialProps: {
          subscribers: mockSubscribers,
          mrr: mockSubscriptionMRR,
        },
      }
    );

    const firstPayoutData = result.current.payoutData;

    // Rerender with same props
    rerender({
      subscribers: mockSubscribers,
      mrr: mockSubscriptionMRR,
    });

    // Should return same reference (memoized)
    expect(result.current.payoutData).toBe(firstPayoutData);
  });

  it('should calculate next settlement date correctly', () => {
    const { result } = renderHook(() =>
      usePayoutCalculations(mockSubscribers, mockSubscriptionMRR)
    );

    expect(result.current.payoutData.nextSettlement).toBeDefined();
    expect(result.current.payoutData.settlementCycle).toBe('Weekly (Friday)');
  });
});
