import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { usePayoutCalculations } from '../hooks/usePayoutCalculations';
import {
  downloadPayoutCSV,
  downloadAuditTrail,
  downloadSAPFormat,
  downloadOracleFormat,
} from '../utils/exportUtils';

/**
 * Partner Portal - Financial Settlement View
 * 
 * Designed for TAZARA/ZRL accountants
 * Real-time reconciliation with useMemo optimization
 * 
 * Trust Layer:
 * - Net Railway Revenue (theirs)
 * - Sentinel Service Fees (ours)
 * - Mobile Money Taxes (government)
 */
export default function PartnerPortalScreen({ navigation }) {
  // Mock data (replace with actual API)
  const [subscribers] = useState({
    traderSubs: 250,
    touristSubs: 50,
    domesticSubs: 100,
    commuterSubs: 900,
  });

  const [subscriptionMRR] = useState(
    (250 * 50) + (900 * 120) + (50 * 250) + (100 * 50)
  );

  // Optimized calculations with useMemo
  const { payoutData, reconciliationData } = usePayoutCalculations(
    subscribers,
    subscriptionMRR
  );

  // Export handlers
  const handleExportCSV = async () => {
    const result = await downloadPayoutCSV({ payoutData, reconciliationData }, 1);
    if (result.success) {
      Alert.alert('Export Successful', `Generated ${result.filename} with ${result.rows} rows`);
    }
  };

  const handleExportAudit = async () => {
    const result = await downloadAuditTrail({ payoutData, reconciliationData }, 1);
    if (result.success) {
      Alert.alert('Audit Trail Generated', `File: ${result.filename}`);
    }
  };

  const handleExportSAP = async () => {
    const result = await downloadSAPFormat({ payoutData, reconciliationData }, 1);
    if (result.success) {
      Alert.alert('SAP Format Ready', `Generated ${result.filename} for SAP import`);
    }
  };

  const handleExportOracle = async () => {
    const result = await downloadOracleFormat({ payoutData, reconciliationData }, 1);
    if (result.success) {
      Alert.alert('Oracle Format Ready', `Generated ${result.filename} for Oracle import`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Settlement Portal</Text>
        <Text style={styles.headerSubtitle}>
          Sentinel × TAZARA/ZRL Reconciliation
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {/* Gross Ticket Volume */}
        <View style={[styles.summaryCard, styles.cardWhite]}>
          <Text style={styles.cardLabel}>GROSS TICKET VOLUME</Text>
          <Text style={styles.cardValue}>
            ZMW {payoutData.totalVolume.toLocaleString()}
          </Text>
          <Text style={styles.cardSubtext}>
            Total sales facilitated
          </Text>
        </View>

        {/* Net Railway Payout */}
        <View style={[styles.summaryCard, styles.cardBlue]}>
          <Text style={styles.cardLabelWhite}>NET RAILWAY PAYOUT</Text>
          <Text style={styles.cardValueWhite}>
            ZMW {payoutData.railwayPayout.toLocaleString()}
          </Text>
          <Text style={styles.cardSubtextWhite}>
            Scheduled for: {payoutData.nextSettlement}
          </Text>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>
              {payoutData.railwayShare.toFixed(0)}% of sales
            </Text>
          </View>
        </View>

        {/* Sentinel Service Fees */}
        <View style={[styles.summaryCard, styles.cardWhite]}>
          <Text style={styles.cardLabel}>SENTINEL SERVICE FEES</Text>
          <Text style={[styles.cardValue, styles.cardValueGreen]}>
            ZMW {payoutData.sentinelEarnings.toLocaleString()}
          </Text>
          <Text style={styles.cardSubtext}>
            Subscriptions + 10% commission
          </Text>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subscription Revenue</Text>
            <Text style={styles.breakdownValue}>
              ZMW {payoutData.subscriptionRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Commission Revenue (10%)</Text>
            <Text style={styles.breakdownValue}>
              ZMW {payoutData.commissionRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
            <Text style={styles.breakdownLabelBold}>Total Sentinel Earnings</Text>
            <Text style={styles.breakdownValueBold}>
              ZMW {payoutData.sentinelEarnings.toLocaleString()}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tax Withholding (16% VAT)</Text>
            <Text style={[styles.breakdownValue, styles.breakdownValueRed]}>
              -ZMW {payoutData.taxWithholding.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownRowFinal]}>
            <Text style={styles.breakdownLabelBold}>Net Sentinel Earnings</Text>
            <Text style={[styles.breakdownValueBold, styles.breakdownValueGreen]}>
              ZMW {payoutData.sentinelNetEarnings.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Reconciliation Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Item Reconciliation</Text>
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSource]}>Source</Text>
            <Text style={[styles.tableHeaderText, styles.colNumber]}>Subs</Text>
            <Text style={[styles.tableHeaderText, styles.colNumber]}>Bookings</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Gross</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Comm</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Railway Net</Text>
          </View>

          {/* Table Rows */}
          {reconciliationData.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.colSource]}>
                <Text style={styles.tableIcon}>{row.icon}</Text>
                <Text style={styles.tableCellText}>{row.source}</Text>
              </View>
              <Text style={[styles.tableCellText, styles.colNumber]}>
                {row.subscribers}
              </Text>
              <Text style={[styles.tableCellText, styles.colNumber]}>
                {row.bookings.toFixed(0)}
              </Text>
              <Text style={[styles.tableCellText, styles.colAmount]}>
                {row.grossSales.toLocaleString()}
              </Text>
              <Text style={[styles.tableCellTextBlue, styles.colAmount]}>
                -{row.commission.toLocaleString()}
              </Text>
              <Text style={[styles.tableCellTextBold, styles.colAmount]}>
                {row.railwayNet.toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Table Footer (Totals) */}
          <View style={[styles.tableRow, styles.tableFooter]}>
            <Text style={[styles.tableCellTextBold, styles.colSource]}>
              TOTAL
            </Text>
            <Text style={[styles.tableCellTextBold, styles.colNumber]}>
              {reconciliationData.reduce((sum, row) => sum + row.subscribers, 0)}
            </Text>
            <Text style={[styles.tableCellTextBold, styles.colNumber]}>
              {reconciliationData.reduce((sum, row) => sum + row.bookings, 0).toFixed(0)}
            </Text>
            <Text style={[styles.tableCellTextBold, styles.colAmount]}>
              {payoutData.totalSales.toLocaleString()}
            </Text>
            <Text style={[styles.tableCellTextBlue, styles.colAmount]}>
              -{payoutData.commissionRevenue.toLocaleString()}
            </Text>
            <Text style={[styles.tableCellTextBold, styles.colAmount]}>
              {payoutData.railwayPayout.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Trust Layer Visualization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trust Layer: Fund Distribution</Text>
        <View style={styles.trustCard}>
          <View style={styles.trustRow}>
            <View style={styles.trustBar}>
              <View style={[styles.trustSegment, styles.trustRailway, { flex: payoutData.railwayShare }]}>
                <Text style={styles.trustLabel}>Railway</Text>
                <Text style={styles.trustValue}>{payoutData.railwayShare.toFixed(0)}%</Text>
              </View>
              <View style={[styles.trustSegment, styles.trustSentinel, { flex: payoutData.sentinelShare }]}>
                <Text style={styles.trustLabel}>Sentinel</Text>
                <Text style={styles.trustValue}>{payoutData.sentinelShare.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.trustLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.trustRailway]} />
              <Text style={styles.legendText}>
                Railway Revenue: ZMW {payoutData.railwayPayout.toLocaleString()}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.trustSentinel]} />
              <Text style={styles.legendText}>
                Sentinel Commission: ZMW {payoutData.commissionRevenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.trustTax]} />
              <Text style={styles.legendText}>
                Tax Withholding (16%): ZMW {payoutData.taxWithholding.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settlement Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settlement Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Settlement Cycle:</Text>
            <Text style={styles.infoValue}>{payoutData.settlementCycle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Settlement:</Text>
            <Text style={styles.infoValue}>{payoutData.nextSettlement}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Commission Rate:</Text>
            <Text style={styles.infoValue}>10% of ticket sales</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tax Rate:</Text>
            <Text style={styles.infoValue}>{payoutData.taxRate}% VAT (ZRA/TRA)</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportCSV}
        >
          <Text style={styles.actionButtonText}>📊 Export CSV Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportAudit}
        >
          <Text style={styles.actionButtonText}>🔍 Export Audit Trail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleExportSAP}
        >
          <Text style={styles.actionButtonTextSecondary}>SAP Format</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleExportOracle}
        >
          <Text style={styles.actionButtonTextSecondary}>Oracle Format</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate('PayoutDashboard')}
        >
          <Text style={styles.actionButtonTextSecondary}>💰 View Payout Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>📋 Reconciliation Notes</Text>
        <Text style={styles.footerText}>
          • All amounts in ZMW (Zambian Kwacha){'\n'}
          • Commission: 10% of gross ticket sales{'\n'}
          • Railway receives: 90% of ticket sales{'\n'}
          • Sentinel retains: 100% of subscription fees + 10% commission{'\n'}
          • Tax: 16% VAT withheld on Sentinel earnings{'\n'}
          • Settlement: Every Friday via bank transfer{'\n'}
          • Audit trails available on request{'\n'}
          • Contact: finance@sentinelrailways.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#1E40AF',
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  summaryGrid: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardBlue: {
    backgroundColor: '#1E40AF',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardLabelWhite: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E0E7FF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardValueWhite: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardValueGreen: {
    color: '#059669',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  cardSubtextWhite: {
    fontSize: 11,
    color: '#E0E7FF',
    fontStyle: 'italic',
  },
  percentageBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  breakdownRowTotal: {
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 12,
  },
  breakdownRowFinal: {
    borderBottomWidth: 0,
    backgroundColor: '#F0FDF4',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: -16,
    paddingBottom: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  breakdownLabelBold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  breakdownValueRed: {
    color: '#DC2626',
  },
  breakdownValueGreen: {
    color: '#059669',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableFooter: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  tableCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tableCellText: {
    fontSize: 13,
    color: '#475569',
  },
  tableCellTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tableCellTextBlue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  colSource: {
    flex: 3,
  },
  colNumber: {
    flex: 1,
    textAlign: 'center',
  },
  colAmount: {
    flex: 1.5,
    textAlign: 'right',
  },
  trustCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trustRow: {
    marginBottom: 20,
  },
  trustBar: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  trustSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustRailway: {
    backgroundColor: '#1E40AF',
  },
  trustSentinel: {
    backgroundColor: '#059669',
  },
  trustTax: {
    backgroundColor: '#F59E0B',
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  trustValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trustLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    fontSize: 13,
    color: '#475569',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
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
  footer: {
    backgroundColor: '#F8FAFC',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 22,
  },
});
