#!/usr/bin/env node

/**
 * Airtable Sync Script - Blockchain Transactions
 * 
 * Syncs blockchain transaction data (Sui/Polygon) to Airtable
 * Run: node scripts/airtable-sync/sync-transactions.js
 */

const Airtable = require('airtable');
const fetch = require('node-fetch');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_OPERATIONS_BASE_ID;
const BACKEND_API_URL = process.env.RAILWAYS_API_URL || 'https://africa-railways.vercel.app';

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Fetch transactions from backend
 */
async function fetchTransactions(since = null) {
  try {
    const sinceParam = since ? `?since=${since}` : '';
    console.log('📡 Fetching blockchain transactions...');
    
    const response = await fetch(`${BACKEND_API_URL}/api/transactions${sinceParam}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} transactions`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
    throw error;
  }
}

/**
 * Transform transaction data to Airtable format
 */
function transformTransaction(tx) {
  return {
    fields: {
      'Transaction ID': tx.transaction_hash || tx.tx_hash || tx.id,
      'Type': tx.type || tx.transaction_type || 'Ticket Purchase',
      'Wallet Address': tx.wallet_address || tx.from_address,
      'Amount (AFC)': parseFloat(tx.amount_afc || tx.amount || 0),
      'Amount (USD)': parseFloat(tx.amount_usd || tx.value_usd || 0),
      'Timestamp': tx.timestamp || tx.created_at,
      'Blockchain': tx.blockchain || tx.network || 'Sui',
      'Status': tx.status || 'Confirmed',
      'Gas Fee': parseFloat(tx.gas_fee || tx.fee || 0),
    }
  };
}

/**
 * Sync transactions to Airtable
 */
async function syncToAirtable(transactions) {
  try {
    console.log('📤 Syncing transactions to Airtable...');
    
    const batchSize = 10;
    let synced = 0;
    let errors = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const records = batch.map(transformTransaction);
      
      try {
        await base('Transactions').create(records, { typecast: true });
        synced += batch.length;
        console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}: ${synced}/${transactions.length} records`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        errors += batch.length;
        console.error(`❌ Error syncing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Sync complete: ${synced}/${transactions.length} records synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error('❌ Error syncing to Airtable:', error.message);
    throw error;
  }
}

/**
 * Calculate transaction analytics
 */
function calculateAnalytics(transactions) {
  const total = transactions.length;
  const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount_afc || tx.amount || 0), 0);
  const totalValueUSD = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount_usd || tx.value_usd || 0), 0);
  const totalGasFees = transactions.reduce((sum, tx) => sum + parseFloat(tx.gas_fee || tx.fee || 0), 0);
  
  const byBlockchain = transactions.reduce((acc, tx) => {
    const chain = tx.blockchain || tx.network || 'Sui';
    acc[chain] = (acc[chain] || 0) + 1;
    return acc;
  }, {});
  
  const byType = transactions.reduce((acc, tx) => {
    const type = tx.type || tx.transaction_type || 'Ticket Purchase';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    totalVolume: totalVolume.toFixed(2),
    totalValueUSD: totalValueUSD.toFixed(2),
    totalGasFees: totalGasFees.toFixed(6),
    avgTransactionSize: (totalVolume / total).toFixed(2),
    byBlockchain,
    byType,
  };
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting blockchain transactions sync...');
  console.log(`📍 Backend API: ${BACKEND_API_URL}`);
  console.log(`📍 Airtable Base: ${AIRTABLE_BASE_ID}`);
  console.log('');
  
  try {
    // Validate environment variables
    if (!AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is required');
    }
    if (!AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_OPERATIONS_BASE_ID environment variable is required');
    }
    
    // Fetch transactions from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 Fetching transactions since: ${since}`);
    console.log('');
    
    const transactions = await fetchTransactions(since);
    
    if (transactions.length === 0) {
      console.log('⚠️  No transactions to sync');
      return;
    }
    
    // Calculate analytics
    const analytics = calculateAnalytics(transactions);
    console.log('📊 Transaction Analytics:');
    console.log(`   Total Transactions: ${analytics.total}`);
    console.log(`   Total Volume: ${analytics.totalVolume} AFC`);
    console.log(`   Total Value: $${analytics.totalValueUSD} USD`);
    console.log(`   Total Gas Fees: ${analytics.totalGasFees} AFC`);
    console.log(`   Avg Transaction: ${analytics.avgTransactionSize} AFC`);
    console.log(`   By Blockchain:`, analytics.byBlockchain);
    console.log(`   By Type:`, analytics.byType);
    console.log('');
    
    const result = await syncToAirtable(transactions);
    
    console.log('');
    console.log('✅ Transactions sync completed successfully');
    console.log(`📊 Stats: ${result.synced} synced, ${result.errors} errors`);
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fetchTransactions, syncToAirtable, calculateAnalytics };
