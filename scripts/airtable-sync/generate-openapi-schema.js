#!/usr/bin/env node

/**
 * OpenAPI Schema Generator for Airtable Bases
 * 
 * Generates OpenAPI 3.0 schema for Custom GPT integration
 * Run: node scripts/airtable-sync/generate-openapi-schema.js
 */

import Airtable from 'airtable';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_OPERATIONS_BASE_ID = process.env.AIRTABLE_OPERATIONS_BASE_ID;

/**
 * Generate OpenAPI schema for Airtable base
 */
function generateOpenAPISchema(baseId, baseName, tables) {
  const schema = {
    openapi: '3.0.0',
    info: {
      title: `Africa Railways ${baseName} API`,
      description: `API for querying ${baseName} data from Airtable`,
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://api.airtable.com/v0',
        description: 'Airtable API Server',
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
        },
      },
      schemas: {},
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  };

  // Generate paths for each table
  tables.forEach(table => {
    const tablePath = `/${baseId}/${encodeURIComponent(table.name)}`;
    
    // List records endpoint
    schema.paths[tablePath] = {
      get: {
        summary: `List ${table.name}`,
        description: `Retrieve records from ${table.name} table`,
        operationId: `list${table.name.replace(/\s+/g, '')}`,
        parameters: [
          {
            name: 'maxRecords',
            in: 'query',
            description: 'Maximum number of records to return',
            schema: { type: 'integer', default: 100, maximum: 100 },
          },
          {
            name: 'view',
            in: 'query',
            description: 'Name of view to use',
            schema: { type: 'string' },
          },
          {
            name: 'filterByFormula',
            in: 'query',
            description: 'Airtable formula to filter records',
            schema: { type: 'string' },
          },
          {
            name: 'sort[0][field]',
            in: 'query',
            description: 'Field to sort by',
            schema: { type: 'string' },
          },
          {
            name: 'sort[0][direction]',
            in: 'query',
            description: 'Sort direction',
            schema: { type: 'string', enum: ['asc', 'desc'] },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    records: {
                      type: 'array',
                      items: { $ref: `#/components/schemas/${table.name.replace(/\s+/g, '')}` },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Generate schema for table
    schema.components.schemas[table.name.replace(/\s+/g, '')] = {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Record ID' },
        createdTime: { type: 'string', format: 'date-time' },
        fields: {
          type: 'object',
          properties: table.fields.reduce((acc, field) => {
            acc[field.name] = {
              type: field.type,
              description: field.description || `${field.name} field`,
            };
            return acc;
          }, {}),
        },
      },
    };
  });

  return schema;
}

/**
 * Define table structures
 */
const operationsTables = [
  {
    name: 'Schedules',
    fields: [
      { name: 'Schedule ID', type: 'string' },
      { name: 'Train', type: 'string' },
      { name: 'Route', type: 'string' },
      { name: 'Departure Station', type: 'string' },
      { name: 'Arrival Station', type: 'string' },
      { name: 'Departure Time', type: 'string' },
      { name: 'Arrival Time', type: 'string' },
      { name: 'Status', type: 'string' },
      { name: 'Ticket Price (Economy)', type: 'number' },
      { name: 'Ticket Price (Business)', type: 'number' },
      { name: 'Ticket Price (First)', type: 'number' },
    ],
  },
  {
    name: 'Bookings',
    fields: [
      { name: 'Booking ID', type: 'string' },
      { name: 'Passenger Name', type: 'string' },
      { name: 'Passenger Phone', type: 'string' },
      { name: 'Class', type: 'string' },
      { name: 'Travel Date', type: 'string' },
      { name: 'Status', type: 'string' },
      { name: 'Amount Paid', type: 'number' },
    ],
  },
  {
    name: 'Transactions',
    fields: [
      { name: 'Transaction ID', type: 'string' },
      { name: 'Type', type: 'string' },
      { name: 'Amount (AFC)', type: 'number' },
      { name: 'Amount (USD)', type: 'number' },
      { name: 'Timestamp', type: 'string' },
      { name: 'Status', type: 'string' },
    ],
  },
];

/**
 * Main function
 */
async function main() {
  console.log('🔧 Generating OpenAPI Schema for Airtable Integration');
  console.log('═'.repeat(60));
  console.log('');

  if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY not found in environment');
    process.exit(1);
  }

  // Generate schema
  const schema = generateOpenAPISchema(
    AIRTABLE_OPERATIONS_BASE_ID || 'YOUR_BASE_ID',
    'Operations',
    operationsTables
  );

  // Save to file
  const outputPath = path.join(process.cwd(), 'openapi-airtable-schema.json');
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));

  console.log('✅ OpenAPI schema generated successfully');
  console.log(`📄 Saved to: ${outputPath}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Review the schema file');
  console.log('2. Upload to Custom GPT configuration');
  console.log('3. Test with ChatGPT queries');
  console.log('');
}

main();
