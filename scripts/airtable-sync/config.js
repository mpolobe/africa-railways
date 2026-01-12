/**
 * Airtable Sync Configuration
 * 
 * Central configuration for all Airtable sync scripts
 */

module.exports = {
  // Airtable Configuration
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    bases: {
      infrastructure: process.env.AIRTABLE_INFRASTRUCTURE_BASE_ID,
      operations: process.env.AIRTABLE_OPERATIONS_BASE_ID,
      sentinel: process.env.AIRTABLE_SENTINEL_BASE_ID,
      financial: process.env.AIRTABLE_FINANCIAL_BASE_ID,
    },
  },

  // Backend API Configuration
  backend: {
    url: process.env.RAILWAYS_API_URL || 'https://africa-railways.vercel.app',
    apiKey: process.env.RAILWAYS_API_KEY,
    timeout: 30000, // 30 seconds
  },

  // Sync Configuration
  sync: {
    batchSize: 10, // Airtable max records per batch
    rateLimit: 200, // ms between batches
    retryAttempts: 3,
    retryDelay: 1000, // ms
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  // Sync Schedules (cron format)
  schedules: {
    schedules: '0 */6 * * *',      // Every 6 hours
    bookings: '*/15 * * * *',       // Every 15 minutes
    ussdSessions: '*/30 * * * *',   // Every 30 minutes
    transactions: '*/10 * * * *',   // Every 10 minutes
    maintenance: '0 0 * * *',       // Daily at midnight
    safetyReports: '*/5 * * * *',   // Every 5 minutes
  },

  // Table Mappings
  tables: {
    operations: {
      schedules: 'Schedules',
      bookings: 'Bookings',
      ussdSessions: 'USSD Sessions',
      transactions: 'Transactions',
    },
    infrastructure: {
      railLines: 'Rail Lines',
      stations: 'Stations',
      trains: 'Trains / Rolling Stock',
      maintenanceLogs: 'Maintenance Logs',
      capacityAllocations: 'Capacity Allocations',
    },
    sentinel: {
      safetyReports: 'Safety Reports',
      incidents: 'Incidents',
    },
    financial: {
      revenue: 'Revenue Tracking',
      costs: 'Operating Costs',
      metrics: 'Performance Metrics',
    },
  },

  // Field Mappings (backend field -> Airtable field)
  fieldMappings: {
    booking: {
      'booking_id': 'Booking ID',
      'passenger_name': 'Passenger Name',
      'phone': 'Passenger Phone',
      'email': 'Passenger Email',
      'wallet_address': 'Wallet Address',
      'class': 'Class',
      'seat_number': 'Seat Number',
      'created_at': 'Booking Date',
      'travel_date': 'Travel Date',
      'payment_method': 'Payment Method',
      'amount': 'Amount Paid',
      'status': 'Status',
      'rewards_earned': 'AFRC Rewards',
      'source': 'Booking Source',
    },
    schedule: {
      'schedule_id': 'Schedule ID',
      'train_id': 'Train',
      'route_name': 'Route',
      'origin': 'Departure Station',
      'destination': 'Arrival Station',
      'departure_time': 'Departure Time',
      'arrival_time': 'Arrival Time',
      'operating_days': 'Days of Operation',
      'status': 'Status',
      'price_economy': 'Ticket Price (Economy)',
      'price_business': 'Ticket Price (Business)',
      'price_first': 'Ticket Price (First)',
    },
    transaction: {
      'transaction_hash': 'Transaction ID',
      'type': 'Type',
      'wallet_address': 'Wallet Address',
      'amount_afc': 'Amount (AFC)',
      'amount_usd': 'Amount (USD)',
      'timestamp': 'Timestamp',
      'blockchain': 'Blockchain',
      'status': 'Status',
      'gas_fee': 'Gas Fee',
    },
    ussdSession: {
      'session_id': 'Session ID',
      'phone_number': 'Phone Number',
      'start_time': 'Start Time',
      'end_time': 'End Time',
      'menu_path': 'Menu Path',
      'action': 'Action Completed',
      'provider': 'Provider',
      'cost': 'Cost (USD)',
      'status': 'Status',
    },
  },

  // Validation Rules
  validation: {
    required: {
      booking: ['booking_id', 'passenger_name', 'travel_date'],
      schedule: ['schedule_id', 'train_id', 'departure_time'],
      transaction: ['transaction_hash', 'wallet_address', 'amount_afc'],
      ussdSession: ['session_id', 'phone_number', 'start_time'],
    },
  },
};
