import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Multi-Currency Price Display Component
 * Shows ticket prices in USD, Local Currency, and AFC
 * 
 * @param {number} priceUSD - Base price in USD
 * @param {string} localCurrency - Local currency code (e.g., 'ZMW', 'TZS', 'KES')
 * @param {number} exchangeRate - Exchange rate from USD to local currency
 * @param {number} afcRate - AFC to USD exchange rate (default: 1 AFC = 1 USD)
 * @param {string} size - Display size: 'small', 'medium', 'large'
 * @param {boolean} showLabels - Whether to show currency labels
 */
const MultiCurrencyPrice = ({ 
  priceUSD, 
  localCurrency = 'ZMW', 
  exchangeRate = 27.5, 
  afcRate = 1.0,
  size = 'medium',
  showLabels = true 
}) => {
  // Calculate prices
  const priceLocal = priceUSD * exchangeRate;
  const priceAFC = priceUSD / afcRate;

  // Get currency symbols
  const getCurrencySymbol = (code) => {
    const symbols = {
      'USD': '$',
      'ZMW': 'ZK',
      'TZS': 'TSh',
      'KES': 'KSh',
      'UGX': 'USh',
      'RWF': 'FRw',
      'ETB': 'Br',
      'ZAR': 'R',
    };
    return symbols[code] || code;
  };

  // Format number with commas
  const formatNumber = (num, decimals = 2) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // Get styles based on size
  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      primaryPrice: styles.primaryPriceSmall,
      secondaryPrice: styles.secondaryPriceSmall,
      label: styles.labelSmall,
    },
    medium: {
      container: styles.containerMedium,
      primaryPrice: styles.primaryPriceMedium,
      secondaryPrice: styles.secondaryPriceMedium,
      label: styles.labelMedium,
    },
    large: {
      container: styles.containerLarge,
      primaryPrice: styles.primaryPriceLarge,
      secondaryPrice: styles.secondaryPriceLarge,
      label: styles.labelLarge,
    },
  };

  const currentStyles = sizeStyles[size] || sizeStyles.medium;

  return (
    <View style={[styles.container, currentStyles.container]}>
      {/* Primary Price - Local Currency */}
      <View style={styles.priceRow}>
        <Text style={[styles.primaryPrice, currentStyles.primaryPrice]}>
          {getCurrencySymbol(localCurrency)} {formatNumber(priceLocal, 0)}
        </Text>
        {showLabels && (
          <Text style={[styles.label, currentStyles.label]}>{localCurrency}</Text>
        )}
      </View>

      {/* Secondary Prices - USD and AFC */}
      <View style={styles.secondaryContainer}>
        <View style={styles.secondaryRow}>
          <Text style={[styles.secondaryPrice, currentStyles.secondaryPrice]}>
            ${formatNumber(priceUSD)}
          </Text>
          {showLabels && (
            <Text style={[styles.secondaryLabel, currentStyles.label]}>USD</Text>
          )}
        </View>

        <Text style={styles.separator}>•</Text>

        <View style={styles.secondaryRow}>
          <Text style={[styles.secondaryPrice, styles.afcPrice, currentStyles.secondaryPrice]}>
            {formatNumber(priceAFC)} AFC
          </Text>
          {showLabels && (
            <Text style={[styles.secondaryLabel, styles.afcLabel, currentStyles.label]}>
              Africoin
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  
  // Small size
  containerSmall: {
    paddingVertical: 4,
  },
  primaryPriceSmall: {
    fontSize: 16,
  },
  secondaryPriceSmall: {
    fontSize: 11,
  },
  labelSmall: {
    fontSize: 9,
  },

  // Medium size
  containerMedium: {
    paddingVertical: 8,
  },
  primaryPriceMedium: {
    fontSize: 24,
  },
  secondaryPriceMedium: {
    fontSize: 13,
  },
  labelMedium: {
    fontSize: 10,
  },

  // Large size
  containerLarge: {
    paddingVertical: 12,
  },
  primaryPriceLarge: {
    fontSize: 32,
  },
  secondaryPriceLarge: {
    fontSize: 16,
  },
  labelLarge: {
    fontSize: 12,
  },

  // Price row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  primaryPrice: {
    color: '#FFB800',
    fontWeight: 'bold',
    marginRight: 8,
  },
  label: {
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Secondary prices
  secondaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  secondaryPrice: {
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 4,
  },
  secondaryLabel: {
    color: '#475569',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  separator: {
    color: '#475569',
    marginHorizontal: 8,
    fontSize: 12,
  },

  // AFC specific styling
  afcPrice: {
    color: '#38bdf8',
  },
  afcLabel: {
    color: '#0284c7',
  },
});

export default MultiCurrencyPrice;
