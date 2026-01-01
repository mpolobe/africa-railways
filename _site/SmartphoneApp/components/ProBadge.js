import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Pro Badge Component
 * 
 * Displays a gold/holographic badge next to user's name
 * to signify Pro subscription status
 * 
 * Usage:
 * <ProBadge planId="sentinel_trader" size="small" />
 */
export default function ProBadge({ planId, size = 'medium', style }) {
  if (!planId) return null;

  const getBadgeConfig = () => {
    switch (planId) {
      case 'sentinel_trader':
        return {
          icon: '💼',
          text: 'TRADER PRO',
          color: '#FFD700',
          borderColor: '#FFA500',
          textColor: '#92400E',
        };
      case 'sentinel_commuter':
        return {
          icon: '🚌',
          text: 'COMMUTER PRO',
          color: '#3B82F6',
          borderColor: '#1E40AF',
          textColor: '#1E3A8A',
        };
      case 'sentinel_voyager':
        return {
          icon: '✈️',
          text: 'VOYAGER',
          color: '#8B5CF6',
          borderColor: '#6D28D9',
          textColor: '#4C1D95',
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      icon: styles.iconSmall,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      icon: styles.iconMedium,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      icon: styles.iconLarge,
      text: styles.textLarge,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        {
          backgroundColor: config.color,
          borderColor: config.borderColor,
        },
        style,
      ]}
    >
      <Text style={[styles.icon, currentSize.icon]}>{config.icon}</Text>
      <Text
        style={[
          styles.text,
          currentSize.text,
          { color: config.textColor },
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  containerLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 4,
  },
  iconSmall: {
    fontSize: 12,
  },
  iconMedium: {
    fontSize: 16,
  },
  iconLarge: {
    fontSize: 20,
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
