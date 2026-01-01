import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Metric Cards Component
 * 
 * Displays critical business metrics:
 * - Blended ARPU (Average Revenue Per User)
 * - Customer LTV (Lifetime Value)
 * - Commission Revenue
 * 
 * For investor/board presentations to TAZARA/ZRL
 */
export default function MetricCards({ totalMRR, totalSubscribers, churnRate, commissionRevenue }) {
  // Calculate Blended ARPU
  const blendedARPU = totalSubscribers > 0 ? (totalMRR / totalSubscribers) : 0;
  
  // Calculate LTV (Lifetime Value)
  // LTV = ARPU / Churn Rate
  // At 5% churn, average customer stays 20 months (1/0.05)
  const ltv = churnRate > 0 ? (blendedARPU / churnRate) : 0;
  
  // Calculate CAC ratio (LTV should be 3x CAC)
  const targetCAC = ltv / 3;

  return (
    <View style={styles.container}>
      {/* Blended ARPU Card */}
      <View style={[styles.card, styles.cardBlue]}>
        <Text style={styles.cardLabel}>BLENDED ARPU</Text>
        <Text style={styles.cardValue}>ZMW {blendedARPU.toFixed(2)}</Text>
        <Text style={styles.cardSubtext}>Avg revenue per active seat</Text>
        <Text style={styles.cardDetail}>
          ${(blendedARPU / 19).toFixed(2)} USD
        </Text>
      </View>

      {/* Customer LTV Card */}
      <View style={[styles.card, styles.cardGreen]}>
        <Text style={styles.cardLabel}>CUSTOMER LTV</Text>
        <Text style={styles.cardValue}>ZMW {ltv.toFixed(2)}</Text>
        <Text style={styles.cardSubtext}>Total projected value per user</Text>
        <Text style={styles.cardDetail}>
          ~{(1 / churnRate).toFixed(0)} months retention
        </Text>
      </View>

      {/* Commission Revenue Card */}
      <View style={[styles.card, styles.cardPurple]}>
        <Text style={styles.cardLabel}>COMMISSION REV</Text>
        <Text style={styles.cardValue}>ZMW {commissionRevenue.toFixed(0)}</Text>
        <Text style={styles.cardSubtext}>10% booking commission</Text>
        <Text style={styles.cardDetail}>
          ${(commissionRevenue / 19).toFixed(0)} USD
        </Text>
      </View>

      {/* Target CAC Card */}
      <View style={[styles.card, styles.cardOrange]}>
        <Text style={styles.cardLabel}>TARGET CAC</Text>
        <Text style={styles.cardValue}>ZMW {targetCAC.toFixed(2)}</Text>
        <Text style={styles.cardSubtext}>Max acquisition cost (LTV/3)</Text>
        <Text style={styles.cardDetail}>
          LTV:CAC = 3:1 ratio
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBlue: {
    backgroundColor: '#EFF6FF',
    borderTopColor: '#3B82F6',
  },
  cardGreen: {
    backgroundColor: '#ECFDF5',
    borderTopColor: '#059669',
  },
  cardPurple: {
    backgroundColor: '#F5F3FF',
    borderTopColor: '#8B5CF6',
  },
  cardOrange: {
    backgroundColor: '#FEF3C7',
    borderTopColor: '#F59E0B',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
