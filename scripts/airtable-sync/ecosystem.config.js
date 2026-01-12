/**
 * PM2 Ecosystem Configuration for Airtable Sync Jobs
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'airtable-sync-bookings',
      script: './sync-bookings.js',
      cron_restart: '*/15 * * * *', // Every 15 minutes
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
    {
      name: 'airtable-sync-transactions',
      script: './sync-transactions.js',
      cron_restart: '*/10 * * * *', // Every 10 minutes
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
    {
      name: 'airtable-sync-ussd',
      script: './sync-ussd-sessions.js',
      cron_restart: '*/30 * * * *', // Every 30 minutes
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
    {
      name: 'airtable-sync-schedules',
      script: './sync-schedules.js',
      cron_restart: '0 */6 * * *', // Every 6 hours
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
    {
      name: 'airtable-sync-all',
      script: './sync-all.js',
      cron_restart: '0 0 * * *', // Daily at midnight
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
    },
  ],
};
