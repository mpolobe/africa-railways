/**
 * Wallet Service
 * Manages user wallet balance, transactions, and payment methods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  WALLET: 'user_wallet',
  TRANSACTIONS: 'wallet_transactions',
  PAYMENT_METHODS: 'payment_methods',
};

// Default wallet structure
const DEFAULT_WALLET = {
  balance: 0,
  currency: 'USD',
  localBalance: 0,
  localCurrency: 'ZMW',
  afrcBalance: 0, // Africoin balance
  sentBalance: 0, // SENTINEL token balance
  lastUpdated: null,
};

// Transaction types
export const TRANSACTION_TYPES = {
  TOP_UP: 'top_up',
  TICKET_PURCHASE: 'ticket_purchase',
  REFUND: 'refund',
  PASS_PURCHASE: 'pass_purchase',
  REWARD: 'reward',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
};

// Payment methods
export const PAYMENT_METHODS = {
  MOBILE_MONEY: 'mobile_money',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto',
  WALLET_BALANCE: 'wallet_balance',
};

// Mobile money providers
export const MOBILE_MONEY_PROVIDERS = [
  { id: 'mtn', name: 'MTN Mobile Money', countries: ['Zambia', 'Ghana', 'Uganda', 'Rwanda'] },
  { id: 'airtel', name: 'Airtel Money', countries: ['Zambia', 'Kenya', 'Tanzania', 'Uganda'] },
  { id: 'mpesa', name: 'M-Pesa', countries: ['Kenya', 'Tanzania', 'South Africa'] },
  { id: 'orange', name: 'Orange Money', countries: ['Senegal', 'Mali', 'Ivory Coast'] },
  { id: 'vodacom', name: 'Vodacom M-Pesa', countries: ['Tanzania', 'South Africa'] },
];

/**
 * Get wallet data
 */
export const getWallet = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.WALLET);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default wallet
    await saveWallet(DEFAULT_WALLET);
    return DEFAULT_WALLET;
  } catch (error) {
    console.error('Failed to get wallet:', error);
    return DEFAULT_WALLET;
  }
};

/**
 * Save wallet data
 */
const saveWallet = async (wallet) => {
  try {
    wallet.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.WALLET, JSON.stringify(wallet));
    return wallet;
  } catch (error) {
    console.error('Failed to save wallet:', error);
    throw error;
  }
};

/**
 * Get wallet balance (formatted for display)
 */
export const getWalletBalance = async () => {
  const wallet = await getWallet();
  return {
    balance: wallet.balance,
    formatted: `$${wallet.balance.toFixed(2)}`,
    localBalance: wallet.localBalance,
    localFormatted: `${wallet.localCurrency} ${wallet.localBalance.toFixed(2)}`,
    afrcBalance: wallet.afrcBalance,
    afrcFormatted: `${wallet.afrcBalance.toFixed(2)} AFRC`,
    sentBalance: wallet.sentBalance,
    sentFormatted: `${wallet.sentBalance.toFixed(2)} SENT`,
    currency: wallet.currency,
    localCurrency: wallet.localCurrency,
  };
};

/**
 * Top up wallet
 */
export const topUpWallet = async (amount, paymentMethod, details = {}) => {
  const wallet = await getWallet();
  
  // Add to balance
  wallet.balance += amount;
  
  // Convert to local currency (simplified - use exchange rate service in production)
  const exchangeRate = 27.5; // Example: 1 USD = 27.5 ZMW
  wallet.localBalance = wallet.balance * exchangeRate;
  
  await saveWallet(wallet);
  
  // Record transaction
  await addTransaction({
    type: TRANSACTION_TYPES.TOP_UP,
    amount,
    currency: 'USD',
    paymentMethod,
    details,
    balanceAfter: wallet.balance,
  });
  
  return wallet;
};

/**
 * Deduct from wallet (for purchases)
 */
export const deductFromWallet = async (amount, description, transactionType = TRANSACTION_TYPES.TICKET_PURCHASE) => {
  const wallet = await getWallet();
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  wallet.balance -= amount;
  
  // Update local currency balance
  const exchangeRate = 27.5;
  wallet.localBalance = wallet.balance * exchangeRate;
  
  await saveWallet(wallet);
  
  // Record transaction
  await addTransaction({
    type: transactionType,
    amount: -amount,
    currency: 'USD',
    description,
    balanceAfter: wallet.balance,
  });
  
  return wallet;
};

/**
 * Add reward/bonus to wallet
 */
export const addReward = async (amount, reason) => {
  const wallet = await getWallet();
  
  wallet.balance += amount;
  
  const exchangeRate = 27.5;
  wallet.localBalance = wallet.balance * exchangeRate;
  
  await saveWallet(wallet);
  
  await addTransaction({
    type: TRANSACTION_TYPES.REWARD,
    amount,
    currency: 'USD',
    description: reason,
    balanceAfter: wallet.balance,
  });
  
  return wallet;
};

/**
 * Process refund
 */
export const processRefund = async (amount, ticketId, reason) => {
  const wallet = await getWallet();
  
  wallet.balance += amount;
  
  const exchangeRate = 27.5;
  wallet.localBalance = wallet.balance * exchangeRate;
  
  await saveWallet(wallet);
  
  await addTransaction({
    type: TRANSACTION_TYPES.REFUND,
    amount,
    currency: 'USD',
    description: `Refund for ticket ${ticketId}: ${reason}`,
    ticketId,
    balanceAfter: wallet.balance,
  });
  
  return wallet;
};

/**
 * Add transaction to history
 */
const addTransaction = async (transaction) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    const transactions = data ? JSON.parse(data) : [];
    
    const newTransaction = {
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...transaction,
      timestamp: new Date().toISOString(),
    };
    
    transactions.unshift(newTransaction);
    
    // Keep only last 100 transactions
    if (transactions.length > 100) {
      transactions.pop();
    }
    
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }
};

/**
 * Get transaction history
 */
export const getTransactionHistory = async (limit = 20) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    const transactions = data ? JSON.parse(data) : [];
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
};

/**
 * Get saved payment methods
 */
export const getPaymentMethods = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PAYMENT_METHODS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    return [];
  }
};

/**
 * Add payment method
 */
export const addPaymentMethod = async (method) => {
  try {
    const methods = await getPaymentMethods();
    
    const newMethod = {
      id: `PM-${Date.now()}`,
      ...method,
      addedAt: new Date().toISOString(),
    };
    
    methods.push(newMethod);
    await AsyncStorage.setItem(KEYS.PAYMENT_METHODS, JSON.stringify(methods));
    
    return newMethod;
  } catch (error) {
    console.error('Failed to add payment method:', error);
    throw error;
  }
};

/**
 * Remove payment method
 */
export const removePaymentMethod = async (methodId) => {
  try {
    const methods = await getPaymentMethods();
    const filtered = methods.filter(m => m.id !== methodId);
    await AsyncStorage.setItem(KEYS.PAYMENT_METHODS, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Failed to remove payment method:', error);
    throw error;
  }
};

/**
 * Check if user has sufficient balance
 */
export const hasSufficientBalance = async (amount) => {
  const wallet = await getWallet();
  return wallet.balance >= amount;
};

/**
 * Get wallet summary for header display
 */
export const getWalletSummary = async () => {
  const wallet = await getWallet();
  const transactions = await getTransactionHistory(5);
  
  return {
    balance: wallet.balance,
    formattedBalance: `$${wallet.balance.toFixed(2)}`,
    localBalance: `${wallet.localCurrency} ${wallet.localBalance.toFixed(2)}`,
    recentTransactions: transactions,
    hasBalance: wallet.balance > 0,
    lowBalance: wallet.balance < 10,
  };
};

// Demo: Initialize with some balance for testing
export const initializeDemoWallet = async () => {
  const wallet = await getWallet();
  if (wallet.balance === 0) {
    await topUpWallet(50, PAYMENT_METHODS.MOBILE_MONEY, { 
      provider: 'mtn',
      note: 'Welcome bonus' 
    });
  }
};

export default {
  getWallet,
  getWalletBalance,
  topUpWallet,
  deductFromWallet,
  addReward,
  processRefund,
  getTransactionHistory,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  hasSufficientBalance,
  getWalletSummary,
  initializeDemoWallet,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  MOBILE_MONEY_PROVIDERS,
};
