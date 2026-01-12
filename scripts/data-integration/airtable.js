/**
 * Airtable Client Module
 * 
 * Handles all Airtable operations for data integration
 */

import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

// Configure Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

export const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

/**
 * Upsert records (update if exists, create if not)
 */
export async function upsertRecords(tableName, records, uniqueField = 'id') {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
  };

  for (const record of records) {
    try {
      // Check if record exists
      const existing = await base(tableName)
        .select({
          filterByFormula: `{${uniqueField}} = '${record[uniqueField]}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (existing.length > 0) {
        // Update existing record
        await base(tableName).update(existing[0].id, record);
        results.updated++;
      } else {
        // Create new record
        await base(tableName).create(record);
        results.created++;
      }
    } catch (error) {
      console.error(`Error upserting record:`, error.message);
      results.errors++;
    }
  }

  return results;
}

/**
 * Batch create records
 */
export async function batchCreate(tableName, records) {
  const batchSize = 10; // Airtable limit
  const results = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const created = await base(tableName).create(batch);
      results.push(...created);
    } catch (error) {
      console.error(`Error creating batch ${i / batchSize + 1}:`, error.message);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Query records with filters
 */
export async function queryRecords(tableName, options = {}) {
  try {
    const records = await base(tableName)
      .select({
        maxRecords: options.maxRecords || 100,
        filterByFormula: options.filter || '',
        sort: options.sort || [],
      })
      .all();

    return records.map(record => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error.message);
    return [];
  }
}

/**
 * Delete records by filter
 */
export async function deleteRecords(tableName, filter) {
  try {
    const records = await base(tableName)
      .select({
        filterByFormula: filter,
      })
      .all();

    const recordIds = records.map(r => r.id);
    
    // Delete in batches of 10
    for (let i = 0; i < recordIds.length; i += 10) {
      const batch = recordIds.slice(i, i + 10);
      await base(tableName).destroy(batch);
    }

    return recordIds.length;
  } catch (error) {
    console.error(`Error deleting records:`, error.message);
    return 0;
  }
}

/**
 * Get table schema
 */
export async function getTableSchema(tableName) {
  try {
    const records = await base(tableName)
      .select({ maxRecords: 1 })
      .firstPage();

    if (records.length > 0) {
      return Object.keys(records[0].fields);
    }

    return [];
  } catch (error) {
    console.error(`Error getting schema for ${tableName}:`, error.message);
    return [];
  }
}

export default {
  base,
  upsertRecords,
  batchCreate,
  queryRecords,
  deleteRecords,
  getTableSchema,
};
