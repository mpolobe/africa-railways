/**
 * Supabase Database Backup via pg_dump
 * 
 * Creates SQL dump of Supabase PostgreSQL database and stores in Vercel Blob
 * Triggered via Vercel Cron or manual API call
 * 
 * Environment variables required:
 * - DATABASE_URL (Supabase PostgreSQL connection string)
 * - BLOB_READ_WRITE_TOKEN (from Vercel Blob)
 * - CRON_SECRET (for securing cron endpoint)
 * 
 * Blob Store: Ct3Y1nYAkYqk05Bo
 * Base URL: https://ct3y1nyakyqk05bo.public.blob.vercel-storage.com/
 */

import { put } from '@vercel/blob';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(request) {
  // Verify authorization - only allow from Vercel Cron or with valid secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!databaseUrl) {
    return new Response(JSON.stringify({ 
      error: 'Missing configuration',
      details: 'DATABASE_URL is required'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!blobToken) {
    return new Response(JSON.stringify({ 
      error: 'Missing configuration',
      details: 'BLOB_READ_WRITE_TOKEN is required'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const filename = `backups/sql/backup-${dateStr}.sql`;
    const latestFilename = `backups/sql/backup-latest.sql`;

    // pg_dump command - excludes ownership and ACL for portability
    const dumpCommand = `pg_dump "${databaseUrl}" --no-owner --no-acl`;
    
    const { stdout: dump, stderr } = await execPromise(dumpCommand, {
      maxBuffer: 100 * 1024 * 1024 // 100MB buffer for large databases
    });

    if (stderr && !stderr.includes('warning')) {
      console.warn('pg_dump stderr:', stderr);
    }

    // Upload dated backup to Vercel Blob
    const blob = await put(filename, dump, { 
      access: 'private',
      token: blobToken,
      addRandomSuffix: false
    });

    // Upload latest backup reference
    await put(latestFilename, dump, { 
      access: 'private',
      token: blobToken,
      addRandomSuffix: false
    });

    // Calculate backup size
    const sizeBytes = Buffer.byteLength(dump, 'utf8');
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

    return new Response(JSON.stringify({ 
      success: true,
      timestamp,
      blobStore: 'Ct3Y1nYAkYqk05Bo',
      baseUrl: 'https://ct3y1nyakyqk05bo.public.blob.vercel-storage.com/',
      filename,
      url: blob.url,
      size: `${sizeMB} MB`,
      sizeBytes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Backup failed:', error);
    return new Response(JSON.stringify({
      error: 'Backup failed',
      message: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const config = {
  maxDuration: 60
};
