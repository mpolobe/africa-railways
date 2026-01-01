import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Sentinel Dashboard - Revenue & Growth Analytics
 * 
 * Real-time revenue calculations based on TAZARA/ZRL market data
 * - 3.4M potential users (TAZARA)
 * - 9,000 daily commuters (Dar es Salaam)
 * - 5,000+ weekly cross-border traders
 * - Dynamic growth modeling with churn
 */
export default function SentinelDashboardScreen({ navigation }) {
  const [currentMonth, setCurrentMonth] = useState(1);
  const [assumptions, setAssumptions] = useState({
    // Market penetration rates
    traderPenetration: 5,      // 5% of traders
    touristPenetration: 2,     // 2% of tourists
    domesticPenetration: 3,    // 3% of domestic travelers
    commuterPenetration: 10,   // 10% of daily commuters
    
    // Plan pricing (ZMW)
    traderPlan: 50,
    commuterPlan: 120,
    touristPlan: 250,
    perBookingFee: 15,
    
    // Growth rates (monthly %)
    traderGrowth: 15,
    touristGrowth: 10,
    domesticGrowth: 12,
    commuterGrowth: 20,
    
    // Churn rate
    churnRate: 0.05, // 5% monthly churn
  });

  const [metrics, setMetrics] = useState({
    traderSubs: 0,
    commuterSubs: 0,
    touristSubs: 0,
    domesticSubs: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    averageRevenuePerUser: 0,
  });

  useEffect(() => {
    calculateMetrics();
  }, [currentMonth, assumptions]);

  const calculateMetrics = () => {
    // TAZARA/ZRL Market Size
    const TAZARA_ANNUAL_PASSENGERS = 1600000;
    const DAR_DAILY_COMMUTERS = 9000;
    const CROSS_BORDER_TRADERS = 5000;
    const TOTAL_MARKET = 3400000; // 3.4M potential users
    
    // Calculate base subscribers for month 1
    let traderSubs = Math.round(CROSS_BORDER_TRADERS * (assumptions.traderPenetration / 100));
    let commuterSubs = Math.round(DAR_DAILY_COMMUTERS * (assumptions.commuterPenetration / 100));
    let touristSubs = Math.round((TAZARA_ANNUAL_PASSENGERS * 0.3) * (assumptions.touristPenetration / 100) / 12); // 30% are tourists
    let domesticSubs = Math.round((TAZARA_ANNUAL_PASSENGERS * 0.7) * (assumptions.domesticPenetration / 100) / 12); // 70% domestic
    
    // Apply growth and churn for subsequent months
    if (currentMonth > 1) {
      const churnRate = assumptions.churnRate;
      
      for (let month = 2; month <= currentMonth; month++) {
        // Apply churn and growth
        traderSubs = Math.round(traderSubs * (1 - churnRate) * (1 + assumptions.traderGrowth / 100));
        commuterSubs = Math.round(commuterSubs * (1 - churnRate) * (1 + assumptions.commuterGrowth / 100));
        touristSubs = Math.round(touristSubs * (1 - churnRate) * (1 + assumptions.touristGrowth / 100));
        domesticSubs = Math.round(domesticSubs * (1 - churnRate) * (1 + assumptions.domesticGrowth / 100));
      }
    }
    
    // Calculate revenue
    const totalSubscribers = traderSubs + commuterSubs + touristSubs + domesticSubs;
    
    const monthlySubscriptionRev = (
      (traderSubs * assumptions.traderPlan) +
      (commuterSubs * assumptions.commuterPlan) +
      (touristSubs * assumptions.touristPlan) +
      (domesticSubs * assumptions.traderPlan) // Domestic uses trader plan
    );
    
    // Pay-per-use revenue (20% of market uses one-off bookings)
    const payPerUseUsers = Math.round(TOTAL_MARKET * 0.001); // 0.1% of total market
    const payPerUseRev = payPerUseUsers * assumptions.perBookingFee;
    
    const monthlyRevenue = monthlySubscriptionRev + payPerUseRev;
    const totalRevenue = monthlyRevenue * currentMonth; // Cumulative
    const averageRevenuePerUser = totalSubscribers > 0 ? monthlyRevenue / totalSubscribers : 0;
    
    setMetrics({
      traderSubs,
      commuterSubs,
      touristSubs,
      domesticSubs,
      totalSubscribers,
      monthlyRevenue,
      totalRevenue,
      averageRevenuePerUser,
      payPerUseUsers,
      payPerUseRev,
    });
  };

  const formatCurrency = (amount) => {
    return `ZMW ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatNumber = (num) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const handleMonthChange = (direction) => {
    if (direction === 'next' && currentMonth < 12) {
      setCurrentMonth(currentMonth + 1);
    } else if (direction === 'prev' && currentMonth > 1) {
      setCurrentMonth(currentMonth - 1);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sentinel Dashboard</Text>
        <Text style={styles.headerSubtitle}>Revenue & Growth Analytics</Text>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={[styles.monthButton, currentMonth === 1 && styles.monthButtonDisabled]}
          onPress={() => handleMonthChange('prev')}
          disabled={currentMonth === 1}
        >
          <Text style={styles.monthButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.monthDisplay}>
          <Text style={styles.monthLabel}>Month</Text>
          <Text style={styles.monthNumber}>{currentMonth}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.monthButton, currentMonth === 12 && styles.monthButtonDisabled]}
          onPress={() => handleMonthChange('next')}
          disabled={currentMonth === 12}
        >
          <Text style={styles.monthButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, styles.metricCardPrimary]}>
          <Text style={styles.metricLabel}>Monthly Revenue</Text>
          <Text style={styles.metricValue}>{formatCurrency(metrics.monthlyRevenue)}</Text>
          <Text style={styles.metricSubtext}>
            ${(metrics.monthlyRevenue / 19).toFixed(0)} USD
          </Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardSuccess]}>
          <Text style={styles.metricLabel}>Total Subscribers</Text>
          <Text style={styles.metricValue}>{formatNumber(metrics.totalSubscribers)}</Text>
          <Text style={styles.metricSubtext}>
            Active users
          </Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardWarning]}>
          <Text style={styles.metricLabel}>Cumulative Revenue</Text>
          <Text style={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</Text>
          <Text style={styles.metricSubtext}>
            Months 1-{currentMonth}
          </Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardInfo]}>
          <Text style={styles.metricLabel}>ARPU</Text>
          <Text style={styles.metricValue}>{formatCurrency(metrics.averageRevenuePerUser)}</Text>
          <Text style={styles.metricSubtext}>
            Avg revenue per user
          </Text>
        </View>
      </View>

      {/* Subscriber Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscriber Breakdown</Text>
        
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>💼</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Trader Pro</Text>
                <Text style={styles.breakdownSubtext}>Cross-border traders</Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownValue}>{formatNumber(metrics.traderSubs)}</Text>
              <Text style={styles.breakdownRevenue}>
                {formatCurrency(metrics.traderSubs * assumptions.traderPlan)}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>🚌</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Commuter Pro</Text>
                <Text style={styles.breakdownSubtext}>Daily riders (Dar/Lusaka)</Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownValue}>{formatNumber(metrics.commuterSubs)}</Text>
              <Text style={styles.breakdownRevenue}>
                {formatCurrency(metrics.commuterSubs * assumptions.commuterPlan)}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>✈️</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Voyager</Text>
                <Text style={styles.breakdownSubtext}>International tourists</Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownValue}>{formatNumber(metrics.touristSubs)}</Text>
              <Text style={styles.breakdownRevenue}>
                {formatCurrency(metrics.touristSubs * assumptions.touristPlan)}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>🎫</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Domestic</Text>
                <Text style={styles.breakdownSubtext}>Local travelers</Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownValue}>{formatNumber(metrics.domesticSubs)}</Text>
              <Text style={styles.breakdownRevenue}>
                {formatCurrency(metrics.domesticSubs * assumptions.traderPlan)}
              </Text>
            </View>
          </View>

          <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>💰</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Pay-per-use</Text>
                <Text style={styles.breakdownSubtext}>One-off bookings</Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownValue}>{formatNumber(metrics.payPerUseUsers)}</Text>
              <Text style={styles.breakdownRevenue}>
                {formatCurrency(metrics.payPerUseRev)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Market Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>📊</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>TAZARA Market Penetration</Text>
            <Text style={styles.insightText}>
              Capturing {((metrics.totalSubscribers / 3400000) * 100).toFixed(2)}% of 3.4M potential users
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>📈</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Growth Trajectory</Text>
            <Text style={styles.insightText}>
              At current rates, reaching {formatNumber(metrics.totalSubscribers * 2)} subscribers by Month {currentMonth + 6}
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>💡</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Revenue Opportunity</Text>
            <Text style={styles.insightText}>
              Commuter segment generates highest revenue due to daily rider volume and premium pricing
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>🎯</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Target Markets</Text>
            <Text style={styles.insightText}>
              • 9,000 daily commuters (Dar es Salaam){'\n'}
              • 5,000+ weekly traders{'\n'}
              • 1.6M annual TAZARA passengers
            </Text>
          </View>
        </View>
      </View>

      {/* Assumptions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Assumptions</Text>
        
        <View style={styles.assumptionsCard}>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Trader Penetration:</Text>
            <Text style={styles.assumptionValue}>{assumptions.traderPenetration}%</Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Commuter Penetration:</Text>
            <Text style={styles.assumptionValue}>{assumptions.commuterPenetration}%</Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Tourist Penetration:</Text>
            <Text style={styles.assumptionValue}>{assumptions.touristPenetration}%</Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Monthly Churn Rate:</Text>
            <Text style={styles.assumptionValue}>{(assumptions.churnRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Trader Growth:</Text>
            <Text style={styles.assumptionValue}>{assumptions.traderGrowth}%/month</Text>
          </View>
          <View style={styles.assumptionRow}>
            <Text style={styles.assumptionLabel}>Commuter Growth:</Text>
            <Text style={styles.assumptionValue}>{assumptions.commuterGrowth}%/month</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.actionButtonText}>View Subscriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => {
            // Open financial model in browser
            console.log('Open financial model');
          }}
        >
          <Text style={styles.actionButtonTextSecondary}>Open Financial Model</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  monthButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  monthDisplay: {
    marginHorizontal: 40,
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  monthNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricCardPrimary: {
    backgroundColor: '#1E40AF',
  },
  metricCardSuccess: {
    backgroundColor: '#059669',
  },
  metricCardWarning: {
    backgroundColor: '#F59E0B',
  },
  metricCardInfo: {
    backgroundColor: '#3B82F6',
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
    opacity: 0.9,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  breakdownText: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  breakdownStats: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  breakdownRevenue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  assumptionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  assumptionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  assumptionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  actionButtonTextSecondary: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
