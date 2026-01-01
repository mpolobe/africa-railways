import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * Revenue Flow Visualization
 * 
 * Shows exactly how money moves from passenger's phone to railway's bank account
 * For non-technical stakeholders (TAZARA/ZRL board members)
 * 
 * Flow: Passenger → Mobile Money → Sentinel → Railway + Tax
 */
export default function RevenueFlowVisualization({ amount = 120 }) {
  // Calculate splits
  const ticketPrice = amount;
  const sentinelCommission = ticketPrice * 0.10;
  const railwayRevenue = ticketPrice * 0.90;
  const subscriptionFee = 50; // Example
  const totalSentinelEarnings = sentinelCommission + subscriptionFee;
  const taxWithholding = totalSentinelEarnings * 0.16;
  const sentinelNet = totalSentinelEarnings - taxWithholding;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Flow Visualization</Text>
        <Text style={styles.subtitle}>
          How money moves from passenger to railway
        </Text>
      </View>

      {/* Step 1: Passenger Payment */}
      <View style={styles.flowStep}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Passenger Books Ticket</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.actor}>
            <Text style={styles.actorIcon}>👤</Text>
            <Text style={styles.actorName}>Passenger</Text>
          </View>
          
          <View style={styles.transaction}>
            <Text style={styles.transactionLabel}>Ticket Price</Text>
            <Text style={styles.transactionAmount}>ZMW {ticketPrice}</Text>
            <Text style={styles.transactionMethod}>via MTN/Airtel Money</Text>
          </View>
        </View>

        <View style={styles.arrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>
      </View>

      {/* Step 2: Mobile Money Gateway */}
      <View style={styles.flowStep}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Mobile Money Processing</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.actor}>
            <Text style={styles.actorIcon}>📱</Text>
            <Text style={styles.actorName}>Flutterwave Gateway</Text>
          </View>
          
          <View style={styles.transaction}>
            <Text style={styles.transactionLabel}>Payment Confirmed</Text>
            <Text style={styles.transactionAmount}>ZMW {ticketPrice}</Text>
            <Text style={styles.transactionMethod}>Webhook sent to Sentinel</Text>
          </View>
        </View>

        <View style={styles.arrow}>
          <Text style={styles.arrowText}>↓</Text>
        </View>
      </View>

      {/* Step 3: Sentinel Processing */}
      <View style={styles.flowStep}>
        <View style={styles.stepHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepTitle}>Sentinel Platform</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.actor}>
            <Text style={styles.actorIcon}>🚂</Text>
            <Text style={styles.actorName}>Sentinel Railways</Text>
          </View>
          
          <View style={styles.splitBox}>
            <Text style={styles.splitTitle}>Revenue Split</Text>
            
            <View style={styles.splitRow}>
              <Text style={styles.splitLabel}>Ticket Commission (10%)</Text>
              <Text style={styles.splitValue}>ZMW {sentinelCommission.toFixed(2)}</Text>
            </View>
            
            <View style={styles.splitRow}>
              <Text style={styles.splitLabel}>Subscription Fee</Text>
              <Text style={styles.splitValue}>ZMW {subscriptionFee.toFixed(2)}</Text>
            </View>
            
            <View style={[styles.splitRow, styles.splitRowTotal]}>
              <Text style={styles.splitLabelBold}>Total Sentinel Earnings</Text>
              <Text style={styles.splitValueBold}>ZMW {totalSentinelEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.arrowSplit}>
          <View style={styles.arrowBranch}>
            <Text style={styles.arrowText}>↓</Text>
            <Text style={styles.arrowLabel}>To Railway</Text>
          </View>
          <View style={styles.arrowBranch}>
            <Text style={styles.arrowText}>↓</Text>
            <Text style={styles.arrowLabel}>To Sentinel</Text>
          </View>
        </View>
      </View>

      {/* Step 4: Railway Payout */}
      <View style={styles.flowStep}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, styles.stepNumberBlue]}>
            <Text style={styles.stepNumberText}>4A</Text>
          </View>
          <Text style={styles.stepTitle}>Railway Receives Payment</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.actor}>
            <Text style={styles.actorIcon}>🏦</Text>
            <Text style={styles.actorName}>TAZARA/ZRL Bank Account</Text>
          </View>
          
          <View style={styles.payoutBox}>
            <Text style={styles.payoutLabel}>Net Railway Revenue</Text>
            <Text style={styles.payoutAmount}>ZMW {railwayRevenue.toFixed(2)}</Text>
            <Text style={styles.payoutSubtext}>
              90% of ticket price
            </Text>
            <View style={styles.payoutBadge}>
              <Text style={styles.payoutBadgeText}>✅ Settled Weekly (Friday)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Step 5: Sentinel & Tax */}
      <View style={styles.flowStep}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepNumber, styles.stepNumberGreen]}>
            <Text style={styles.stepNumberText}>4B</Text>
          </View>
          <Text style={styles.stepTitle}>Sentinel & Tax Distribution</Text>
        </View>
        
        <View style={styles.stepContent}>
          <View style={styles.taxSplit}>
            <View style={styles.taxRow}>
              <View style={styles.taxActor}>
                <Text style={styles.actorIcon}>💼</Text>
                <Text style={styles.actorName}>Sentinel Net</Text>
              </View>
              <View style={styles.taxAmount}>
                <Text style={styles.taxValue}>ZMW {sentinelNet.toFixed(2)}</Text>
                <Text style={styles.taxSubtext}>After 16% VAT</Text>
              </View>
            </View>

            <View style={styles.taxRow}>
              <View style={styles.taxActor}>
                <Text style={styles.actorIcon}>🏛️</Text>
                <Text style={styles.actorName}>ZRA/TRA Tax</Text>
              </View>
              <View style={styles.taxAmount}>
                <Text style={styles.taxValue}>ZMW {taxWithholding.toFixed(2)}</Text>
                <Text style={styles.taxSubtext}>16% VAT withheld</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>💡 Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passenger Pays:</Text>
          <Text style={styles.summaryValue}>ZMW {ticketPrice}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Railway Receives:</Text>
          <Text style={[styles.summaryValue, styles.summaryValueBlue]}>
            ZMW {railwayRevenue.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sentinel Earns (Net):</Text>
          <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
            ZMW {sentinelNet.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Government Tax:</Text>
          <Text style={[styles.summaryValue, styles.summaryValueOrange]}>
            ZMW {taxWithholding.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>Total Distributed:</Text>
          <Text style={styles.summaryValueBold}>
            ZMW {(railwayRevenue + sentinelNet + taxWithholding).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Key Points */}
      <View style={styles.keyPoints}>
        <Text style={styles.keyPointsTitle}>🔑 Key Points</Text>
        
        <View style={styles.keyPoint}>
          <Text style={styles.keyPointIcon}>✓</Text>
          <Text style={styles.keyPointText}>
            Railway receives 90% of every ticket sold through Sentinel
          </Text>
        </View>

        <View style={styles.keyPoint}>
          <Text style={styles.keyPointIcon}>✓</Text>
          <Text style={styles.keyPointText}>
            Sentinel earns 10% commission + 100% of subscription fees
          </Text>
        </View>

        <View style={styles.keyPoint}>
          <Text style={styles.keyPointIcon}>✓</Text>
          <Text style={styles.keyPointText}>
            16% VAT is withheld from Sentinel earnings (ZRA/TRA compliance)
          </Text>
        </View>

        <View style={styles.keyPoint}>
          <Text style={styles.keyPointIcon}>✓</Text>
          <Text style={styles.keyPointText}>
            Settlement occurs every Friday via bank transfer
          </Text>
        </View>

        <View style={styles.keyPoint}>
          <Text style={styles.keyPointIcon}>✓</Text>
          <Text style={styles.keyPointText}>
            All transactions are auditable and transparent
          </Text>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  flowStep: {
    margin: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberBlue: {
    backgroundColor: '#3B82F6',
  },
  stepNumberGreen: {
    backgroundColor: '#059669',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actor: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  transaction: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  transactionMethod: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  splitBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  splitRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    marginTop: 8,
    paddingTop: 12,
  },
  splitLabel: {
    fontSize: 13,
    color: '#1E40AF',
  },
  splitLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  splitValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  splitValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  arrow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  arrowText: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  arrowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  arrowBranch: {
    alignItems: 'center',
  },
  arrowLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  payoutBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  payoutLabel: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  payoutSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  payoutBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  payoutBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taxSplit: {
    gap: 16,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  taxActor: {
    flex: 1,
  },
  taxAmount: {
    alignItems: 'flex-end',
  },
  taxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  taxSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  summary: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryValueBlue: {
    color: '#1E40AF',
  },
  summaryValueGreen: {
    color: '#059669',
  },
  summaryValueOrange: {
    color: '#F59E0B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  keyPoints: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 16,
  },
  keyPoint: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  keyPointIcon: {
    fontSize: 16,
    color: '#059669',
    marginRight: 12,
    fontWeight: 'bold',
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});
