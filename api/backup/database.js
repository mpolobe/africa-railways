/**
 * Supabase Database Backup API
 * 
 * Exports key tables from Supabase and stores as JSON in Vercel Blob
 * Triggered via Vercel Cron or manual API call
 * 
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (not anon key - needs full access)
 * - BLOB_READ_WRITE_TOKEN (from Vercel Blob)
 * - CRON_SECRET (for securing cron endpoint)
 * 
 * Blob Store: Ct3Y1nYAkYqk05Bo
 * Base URL: https://ct3y1nyakyqk05bo.public.blob.vercel-storage.com/
 */

const { createClient } = require('@supabase/supabase-js');

// Tables to backup - shared between africa-railways and scroll-waitlist-exchange-1
const TABLES_TO_BACKUP = [
  'users',
  'profiles',
  'bookings',
  'payments',
  'nft_souvenirs',
  'afrc_transactions',
  'phone_wallets',
  'admin_roles',
  'whitelist_entries',
  'api_keys',
  // scroll-waitlist-exchange-1 tables
  'waitlist',
  'waitlist_entries',
  'referrals',
  'exchange_orders',
  'exchange_transactions'
];

module.exports = async (req, res) => {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow if no CRON_SECRET is set (for testing) or if it matches
    if (cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Missing configuration',
      details: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    
    const backupData = {
      timestamp,
      source: 'africa-railways + scroll-waitlist-exchange-1',
      blobStore: 'Ct3Y1nYAkYqk05Bo',
      tables: {},
      metadata: {
        supabaseProject: supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || 'unknown',
        tablesBackedUp: [],
        errors: []
      }
    };

    // Backup each table
    for (const tableName of TABLES_TO_BACKUP) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });

        if (error) {
          // Table might not exist in this project - not an error
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            console.log(`Table ${tableName} does not exist, skipping`);
            continue;
          }
          console.warn(`Failed to backup ${tableName}:`, error.message);
          backupData.metadata.errors.push({
            table: tableName,
            error: error.message
          });
          continue;
        }

        backupData.tables[tableName] = {
          count: count || data?.length || 0,
          data: data || []
        };
        backupData.metadata.tablesBackedUp.push(tableName);
        
      } catch (tableError) {
        console.warn(`Error backing up ${tableName}:`, tableError.message);
        backupData.metadata.errors.push({
          table: tableName,
          error: tableError.message
        });
      }
    }

    // Store in Vercel Blob
    let blobUrl = null;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (blobToken) {
      try {
        const { put } = require('@vercel/blob');
        
        // Store full backup
        const fullBackupFilename = `backups/supabase-backup-${dateStr}.json`;
        const fullBlob = await put(fullBackupFilename, JSON.stringify(backupData, null, 2), {
          access: 'public',
          token: blobToken,
          addRandomSuffix: false
        });
        blobUrl = fullBlob.url;

        // Store latest backup reference
        const latestFilename = `backups/supabase-backup-latest.json`;
        await put(latestFilename, JSON.stringify(backupData, null, 2), {
          access: 'public',
          token: blobToken,
          addRandomSuffix: false
        });

        // Store individual table backups for easier access
        for (const [tableName, tableData] of Object.entries(backupData.tables)) {
          const tableFilename = `backups/tables/${tableName}-${dateStr}.json`;
          await put(tableFilename, JSON.stringify({
            timestamp,
            table: tableName,
            ...tableData
          }, null, 2), {
            access: 'public',
            token: blobToken,
            addRandomSuffix: false
          });
        }

      } catch (blobError) {
        console.warn('Failed to store in Vercel Blob:', blobError.message);
        backupData.metadata.errors.push({
          storage: 'vercel-blob',
          error: blobError.message
        });
      }
    } else {
      backupData.metadata.errors.push({
        storage: 'vercel-blob',
        error: 'BLOB_READ_WRITE_TOKEN not configured'
      });
    }

    // Return backup summary
    return res.status(200).json({
      success: true,
      timestamp,
      blobStore: 'Ct3Y1nYAkYqk05Bo',
      baseUrl: 'https://ct3y1nyakyqk05bo.public.blob.vercel-storage.com/',
      tablesBackedUp: backupData.metadata.tablesBackedUp.length,
      tables: backupData.metadata.tablesBackedUp,
      totalRecords: Object.values(backupData.tables).reduce((sum, t) => sum + t.count, 0),
      blobUrl,
      errors: backupData.metadata.errors,
      // Include data in response if no blob storage (for manual download)
      data: !blobUrl ? backupData : undefined
    });

  } catch (error) {
    console.error('Backup failed:', error);
    return res.status(500).json({
      error: 'Backup failed',
      message: error.message
    });
  }
};
