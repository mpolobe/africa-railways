import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { calculateCommissionRevenue, generateAuditTrail, formatAuditTrail } from '../utils/commissionCalculator';

/**
 * Payout Dashboard
 * 
 * For TAZARA/ZRL accountants to track:
 * - Money Sentinel owes them (ticket sales)
 * - Money they owe Sentinel (10% commission)
 * - Weekly reconciliation
 * - Audit trails
 * 
 * Settlement cycle: Weekly (every Friday)
 */
export default function PayoutDashboardScreen({ navigation }) {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [payoutData, setPayoutData] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);

  useEffect(() => {
    calculatePayouts();
  }, [currentWeek]);

  const calculatePayouts = () => {
    // Mock subscriber data (replace with actual API call)
    const subscribers = {
      traderSubs: 250,
      touristSubs: 50,
      domesticSubs: 100,
      commuterSubs: 900,
    };

    // Calculate weekly commission (monthly / 4)
    const monthlyCommission = calculateCommissionRevenue(subscribers);
    const weeklyCommission = {
      traderCommission: monthlyCommission.traderCommission / 4,
      touristCommission: monthlyCommission.touristCommission / 4,
      domesticCommission: monthlyCommission.domesticCommission / 4,
      commuterCommission: monthlyCommission.commuterCommission / 4,
      totalCommission: monthlyCommission.totalCommission / 4,
      totalSales: monthlyCommission.totalSales / 4,
      breakdown: {
        traders: {
          ...monthlyCommission.breakdown.traders,
          bookings: monthlyCommission.breakdown.traders.bookings / 4,
          sales: monthlyCommission.breakdown.traders.sales / 4,
          commission: monthlyCommission.breakdown.traders.commission / 4,
        },
        tourists: {
          ...monthlyCommission.breakdown.tourists,
          bookings: monthlyCommission.breakdown.tourists.bookings / 4,
          sales: monthlyCommission.breakdown.tourists.sales / 4,
          commission: monthlyCommission.breakdown.tourists.commission / 4,
        },
        domestic: {
          ...monthlyCommission.breakdown.domestic,
          bookings: monthlyCommission.breakdown.domestic.bookings / 4,
          sales: monthlyCommission.breakdown.domestic.sales / 4,
          commission: monthlyCommission.breakdown.domestic.commission / 4,
        },
        commuters: {
          ...monthlyCommission.breakdown.commuters,
          bookings: monthlyCommission.breakdown.commuters.bookings / 4,
          sales: monthlyCommission.breakdown.commuters.sales / 4,
          commission: monthlyCommission.breakdown.commuters.commission / 4,
        },
      },
    };

    // Calculate subscription revenue (Sentinel keeps 100%)
    const subscriptionRevenue = (
      (subscribers.traderSubs * 50) +
      (subscribers.commuterSubs * 120) +
      (subscribers.touristSubs * 250) +
      (subscribers.domesticSubs * 50)
    ) / 4; // Weekly

    // Net settlement calculation
    const sentinelOwesRailway = weeklyCommission.totalSales; // Full ticket price
    const railwayOwesSentinel = weeklyCommission.totalCommission; // 10% commission
    const netSettlement = sentinelOwesRailway - railwayOwesSentinel;

    setPayoutData({
      week: currentWeek,
      subscribers,
      weeklyCommission,
      subscriptionRevenue,
      sentinelOwesRailway,
      railwayOwesSentinel,
      netSettlement,
      settlementDate: getNextFriday(),
      status: currentWeek === 1 ? 'pending' : 'settled',
    });
  };

  const getNextFriday = () => {
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
  };

  const handleExportAuditTrail = () => {
    if (!payoutData) return;

    const auditTrail = generateAuditTrail(payoutData.subscribers, `Week ${currentWeek}`);
    const formattedTrail = formatAuditTrail(auditTrail);

    Alert.alert(
      'Audit Trail Generated',
      'Audit trail has been generated and is ready for export.',
      [
        { text: 'View', onPress: () => console.log(formattedTrail) },
        { text: 'Export PDF', onPress: () => console.log('Export PDF') },
        { text: 'Send Email', onPress: () => console.log('Send Email') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleSettlePayment = () => {
    Alert.alert(
      'Confirm Settlement',
      `Settle payment of ZMW ${payoutData.netSettlement.toFixed(2)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Process settlement
            setSettlementHistory([
              ...settlementHistory,
              {
                week: currentWeek,
                amount: payoutData.netSettlement,
                date: new Date().toISOString(),
                status: 'completed',
              },
            ]);
            Alert.alert('Success', 'Payment settled successfully');
          },
        },
      ]
    );
  };

  if (!payoutData) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payout Dashboard</Text>
        <Text style={styles.headerSubtitle}>TAZARA/ZRL Financial Reconciliation</Text>
      </View>

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={[styles.weekButton, currentWeek === 1 && styles.weekButtonDisabled]}
          onPress={() => setCurrentWeek(currentWeek - 1)}
          disabled={currentWeek === 1}
        >
          <Text style={styles.weekButtonText}>← Prev</Text>
        </TouchableOpacity>

        <View style={styles.weekDisplay}>
          <Text style={styles.weekLabel}>Week</Text>
          <Text style={styles.weekNumber}>{currentWeek}</Text>
          <Text style={styles.weekDate}>Settlement: {payoutData.settlementDate}</Text>
        </View>

        <TouchableOpacity
          style={[styles.weekButton, currentWeek === 52 && styles.weekButtonDisabled]}
          onPress={() => setCurrentWeek(currentWeek + 1)}
          disabled={currentWeek === 52}
        >
          <Text style={styles.weekButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>

      {/* Settlement Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Settlement Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sentinel → Railway</Text>
            <Text style={styles.summarySubtext}>Ticket sales collected</Text>
          </View>
          <Text style={styles.summaryValueRed}>
            ZMW {payoutData.sentinelOwesRailway.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Railway → Sentinel</Text>
            <Text style={styles.summarySubtext}>10% commission earned</Text>
          </View>
          <Text style={styles.summaryValueGreen}>
            ZMW {payoutData.railwayOwesSentinel.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabelBold}>Net Settlement</Text>
            <Text style={styles.summarySubtext}>
              {payoutData.netSettlement > 0 ? 'Sentinel pays Railway' : 'Railway pays Sentinel'}
            </Text>
          </View>
          <Text style={[
            styles.summaryValueTotal,
            payoutData.netSettlement > 0 ? styles.summaryValueRed : styles.summaryValueGreen
          ]}>
            ZMW {Math.abs(payoutData.netSettlement).toFixed(2)}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            payoutData.status === 'settled' ? styles.statusSettled : styles.statusPending
          ]}>
            {payoutData.status === 'settled' ? '✅ Settled' : '⏳ Pending Settlement'}
          </Text>
        </View>
      </View>

      {/* Detailed Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Breakdown</Text>

        <View style={styles.breakdownCard}>
          {/* Traders */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>💼</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Traders</Text>
                <Text style={styles.breakdownSubtext}>
                  {payoutData.subscribers.traderSubs} subscribers × {payoutData.weeklyCommission.breakdown.traders.bookings / payoutData.subscribers.traderSubs} bookings
                </Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownSales}>
                Sales: ZMW {payoutData.weeklyCommission.breakdown.traders.sales.toFixed(0)}
              </Text>
              <Text style={styles.breakdownCommission}>
                Commission: ZMW {payoutData.weeklyCommission.breakdown.traders.commission.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Commuters */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>🚌</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Commuters</Text>
                <Text style={styles.breakdownSubtext}>
                  {payoutData.subscribers.commuterSubs} subscribers × {(payoutData.weeklyCommission.breakdown.commuters.bookings / payoutData.subscribers.commuterSubs).toFixed(0)} bookings
                </Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownSales}>
                Sales: ZMW {payoutData.weeklyCommission.breakdown.commuters.sales.toFixed(0)}
              </Text>
              <Text style={styles.breakdownCommission}>
                Commission: ZMW {payoutData.weeklyCommission.breakdown.commuters.commission.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Tourists */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>✈️</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Tourists</Text>
                <Text style={styles.breakdownSubtext}>
                  {payoutData.subscribers.touristSubs} subscribers × {(payoutData.weeklyCommission.breakdown.tourists.bookings / payoutData.subscribers.touristSubs).toFixed(1)} bookings
                </Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownSales}>
                Sales: ZMW {payoutData.weeklyCommission.breakdown.tourists.sales.toFixed(0)}
              </Text>
              <Text style={styles.breakdownCommission}>
                Commission: ZMW {payoutData.weeklyCommission.breakdown.tourists.commission.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Domestic */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownIcon}>🎫</Text>
              <View style={styles.breakdownText}>
                <Text style={styles.breakdownLabel}>Domestic</Text>
                <Text style={styles.breakdownSubtext}>
                  {payoutData.subscribers.domesticSubs} subscribers × {(payoutData.weeklyCommission.breakdown.domestic.bookings / payoutData.subscribers.domesticSubs).toFixed(1)} bookings
                </Text>
              </View>
            </View>
            <View style={styles.breakdownStats}>
              <Text style={styles.breakdownSales}>
                Sales: ZMW {payoutData.weeklyCommission.breakdown.domestic.sales.toFixed(0)}
              </Text>
              <Text style={styles.breakdownCommission}>
                Commission: ZMW {payoutData.weeklyCommission.breakdown.domestic.commission.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Subscription Revenue (Sentinel Keeps) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Revenue</Text>
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionLabel}>Sentinel Subscription MRR (Weekly)</Text>
          <Text style={styles.subscriptionValue}>
            ZMW {payoutData.subscriptionRevenue.toFixed(2)}
          </Text>
          <Text style={styles.subscriptionSubtext}>
            Sentinel retains 100% of subscription fees
          </Text>
        </View>
      </View>

      {/* Payment Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Instructions</Text>
        <View style={styles.instructionsCard}>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Bank Account:</Text>
            <Text style={styles.instructionValue}>TAZARA Operations Account</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Account Number:</Text>
            <Text style={styles.instructionValue}>1234567890</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Bank:</Text>
            <Text style={styles.instructionValue}>Zambia National Commercial Bank</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Reference:</Text>
            <Text style={styles.instructionValue}>SENTINEL-W{currentWeek}-2025</Text>
          </View>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionLabel}>Due Date:</Text>
            <Text style={styles.instructionValue}>{payoutData.settlementDate}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportAuditTrail}
        >
          <Text style={styles.actionButtonText}>📄 Export Audit Trail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => console.log('Download invoice')}
        >
          <Text style={styles.actionButtonTextSecondary}>📥 Download Invoice</Text>
        </TouchableOpacity>

        {payoutData.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleSettlePayment}
          >
            <Text style={styles.actionButtonText}>✅ Mark as Settled</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settlement History */}
      {settlementHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
          <View style={styles.historyCard}>
            {settlementHistory.map((settlement, index) => (
              <View key={index} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyWeek}>Week {settlement.week}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(settlement.date).toLocaleDateString('en-GB')}
                  </Text>
                </View>
                <View style={styles.historyAmount}>
                  <Text style={styles.historyValue}>
                    ZMW {settlement.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.historyStatus}>✅ {settlement.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer Notes */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>📋 Notes for Accountants</Text>
        <Text style={styles.footerText}>
          • Settlement occurs every Friday{'\n'}
          • Commission rate: 10% of ticket sales{'\n'}
          • Subscription revenue: Sentinel retains 100%{'\n'}
          • All amounts in ZMW (Zambian Kwacha){'\n'}
          • Audit trails available for export{'\n'}
          • Contact: finance@sentinelrailways.com
        </Text>
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
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  weekButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
  },
  weekButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  weekButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekDisplay: {
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  weekNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  weekDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  summaryLabelBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summaryValueRed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  summaryValueGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryValueTotal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    marginTop: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusSettled: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#F59E0B',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  breakdownIcon: {
    fontSize: 24,
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
  breakdownSales: {
    fontSize: 14,
    color: '#374151',
  },
  breakdownCommission: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  subscriptionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
  },
  subscriptionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  subscriptionSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  instructionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actions: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#059669',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonTextSecondary: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyInfo: {
    flex: 1,
  },
  historyWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  historyStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 22,
  },
});
