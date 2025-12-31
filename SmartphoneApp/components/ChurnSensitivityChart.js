import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Churn Sensitivity Chart
 * 
 * Shows how LTV increases for every 1% reduction in churn rate
 * Critical for demonstrating value of customer service investments
 * 
 * Example: At ZMW 50 ARPU
 * - 5% churn → ZMW 1,000 LTV (20 months retention)
 * - 4% churn → ZMW 1,250 LTV (25 months retention)
 * - 3% churn → ZMW 1,667 LTV (33 months retention)
 */
export default function ChurnSensitivityChart({ arpu = 50 }) {
  // Calculate LTV at different churn rates
  const churnRates = [
    { rate: 0.07, label: '7%' },
    { rate: 0.06, label: '6%' },
    { rate: 0.05, label: '5%' },
    { rate: 0.04, label: '4%' },
    { rate: 0.03, label: '3%' },
    { rate: 0.02, label: '2%' },
  ];

  const ltvData = churnRates.map(({ rate, label }) => ({
    churnRate: rate,
    label,
    ltv: arpu / rate,
    retention: 1 / rate,
    improvement: rate === 0.05 ? 0 : ((arpu / rate) - (arpu / 0.05)) / (arpu / 0.05) * 100,
  }));

  const maxLTV = Math.max(...ltvData.map(d => d.ltv));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Churn Sensitivity Analysis</Text>
        <Text style={styles.subtitle}>
          Impact of churn reduction on Customer LTV
        </Text>
      </View>

      <View style={styles.currentMetric}>
        <Text style={styles.currentLabel}>Current ARPU</Text>
        <Text style={styles.currentValue}>ZMW {arpu.toFixed(2)}</Text>
      </View>

      <View style={styles.chart}>
        {ltvData.map((data, index) => {
          const barHeight = (data.ltv / maxLTV) * 200;
          const isBaseline = data.churnRate === 0.05;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight },
                    isBaseline ? styles.barBaseline : styles.barImproved,
                  ]}
                >
                  <Text style={styles.barValue}>
                    {data.ltv.toFixed(0)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.barLabel}>{data.label}</Text>
              <Text style={styles.barSubtext}>
                {data.retention.toFixed(0)}mo
              </Text>
              
              {!isBaseline && (
                <View style={styles.improvementBadge}>
                  <Text style={styles.improvementText}>
                    +{data.improvement.toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.insights}>
        <View style={styles.insightRow}>
          <Text style={styles.insightIcon}>💡</Text>
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Key Insight:</Text> Reducing churn from 5% to 3% 
            increases LTV by {((arpu / 0.03 - arpu / 0.05) / (arpu / 0.05) * 100).toFixed(0)}%, 
            from ZMW {(arpu / 0.05).toFixed(0)} to ZMW {(arpu / 0.03).toFixed(0)}
          </Text>
        </View>

        <View style={styles.insightRow}>
          <Text style={styles.insightIcon}>🎯</Text>
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>Target:</Text> Achieve 3% churn through better 
            customer service, SMS notifications, and priority support
          </Text>
        </View>

        <View style={styles.insightRow}>
          <Text style={styles.insightIcon}>💰</Text>
          <Text style={styles.insightText}>
            <Text style={styles.insightBold}>ROI:</Text> Every ZMW 10 invested in retention 
            features yields ZMW {((arpu / 0.03 - arpu / 0.05) / 10).toFixed(0)} in additional LTV
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.barBaseline]} />
          <Text style={styles.legendText}>Current (5% churn)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.barImproved]} />
          <Text style={styles.legendText}>Improved retention</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentMetric: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    marginBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 40,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  barBaseline: {
    backgroundColor: '#F59E0B',
  },
  barImproved: {
    backgroundColor: '#059669',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  barLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  barSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  improvementBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  improvementText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  insights: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  insightBold: {
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
