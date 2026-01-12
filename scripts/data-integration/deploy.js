#!/usr/bin/env node

/**
 * Deployment Script for Data Integration Pipeline
 * 
 * Handles:
 * - Environment validation
 * - Dependency checks
 * - Service configuration
 * - Health checks
 */

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Required environment variables
 */
const REQUIRED_ENV = {
  core: [
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
  ],
  optional: [
    'AFRICA_RAIL_BASE_URL',
    'AFRICOIN_API_URL',
    'AFRICOIN_API_KEY',
    'OPENAI_API_KEY',
  ],
};

/**
 * Check environment variables
 */
function checkEnvironment() {
  console.log('Checking environment variables...');
  
  const missing = [];
  const present = [];
  const optional = [];
  
  // Check required
  for (const key of REQUIRED_ENV.core) {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }
  
  // Check optional
  for (const key of REQUIRED_ENV.optional) {
    if (process.env[key]) {
      optional.push({ key, status: 'configured' });
    } else {
      optional.push({ key, status: 'not configured' });
    }
  }
  
  console.log(`  Required: ${present.length}/${REQUIRED_ENV.core.length} configured`);
  
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(', ')}`);
  }
  
  console.log('  Optional:');
  optional.forEach(o => {
    const icon = o.status === 'configured' ? '[x]' : '[ ]';
    console.log(`    ${icon} ${o.key}`);
  });
  
  return {
    valid: missing.length === 0,
    missing,
    present,
    optional,
  };
}

/**
 * Check dependencies
 */
function checkDependencies() {
  console.log('\nChecking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  
  const installed = [];
  const missing = [];
  
  for (const dep of deps) {
    try {
      const depPath = path.join(__dirname, 'node_modules', dep);
      if (fs.existsSync(depPath)) {
        installed.push(dep);
      } else {
        missing.push(dep);
      }
    } catch {
      missing.push(dep);
    }
  }
  
  console.log(`  Installed: ${installed.length}/${deps.length}`);
  
  if (missing.length > 0) {
    console.log(`  Missing: ${missing.join(', ')}`);
    console.log('  Run: npm install');
  }
  
  return {
    valid: missing.length === 0,
    installed,
    missing,
  };
}

/**
 * Test Airtable connection
 */
async function testAirtableConnection() {
  console.log('\nTesting Airtable connection...');
  
  try {
    const Airtable = (await import('airtable')).default;
    
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY,
    });
    
    const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
    
    // Try to list tables (will fail gracefully if no access)
    await base('Schedules').select({ maxRecords: 1 }).firstPage();
    
    console.log('  Airtable connection: OK');
    return { valid: true };
  } catch (error) {
    console.log(`  Airtable connection: FAILED - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

/**
 * Test Africoin backend connection
 */
async function testAfricoinConnection() {
  console.log('\nTesting Africoin backend connection...');
  
  if (!process.env.AFRICOIN_API_URL) {
    console.log('  Africoin backend: Not configured (optional)');
    return { valid: true, skipped: true };
  }
  
  try {
    const axios = (await import('axios')).default;
    
    const response = await axios.get(`${process.env.AFRICOIN_API_URL}/health`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.AFRICOIN_API_KEY}`,
      },
    });
    
    console.log(`  Africoin backend: OK (status: ${response.status})`);
    return { valid: true };
  } catch (error) {
    console.log(`  Africoin backend: FAILED - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

/**
 * Test OpenAI connection
 */
async function testOpenAIConnection() {
  console.log('\nTesting OpenAI connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('  OpenAI: Not configured (optional)');
    return { valid: true, skipped: true };
  }
  
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Simple test call
    await openai.models.list();
    
    console.log('  OpenAI: OK');
    return { valid: true };
  } catch (error) {
    console.log(`  OpenAI: FAILED - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

/**
 * Generate PM2 ecosystem config
 */
function generatePM2Config() {
  console.log('\nGenerating PM2 ecosystem config...');
  
  const config = {
    apps: [
      {
        name: 'africa-railways-pipeline',
        script: 'pipeline.js',
        cwd: __dirname,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
          NODE_ENV: 'production',
        },
        cron_restart: '0 */6 * * *', // Every 6 hours
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: path.join(__dirname, 'logs', 'pipeline-error.log'),
        out_file: path.join(__dirname, 'logs', 'pipeline-out.log'),
      },
      {
        name: 'africa-railways-monitor',
        script: 'monitor.js',
        cwd: __dirname,
        instances: 1,
        autorestart: true,
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
      },
    ],
  };
  
  const configPath = path.join(__dirname, 'ecosystem.config.cjs');
  fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 2)};`);
  
  console.log(`  Generated: ${configPath}`);
  return configPath;
}

/**
 * Generate systemd service file
 */
function generateSystemdService() {
  console.log('\nGenerating systemd service file...');
  
  const service = `[Unit]
Description=Africa Railways Data Integration Pipeline
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=${__dirname}
ExecStart=/usr/bin/node ${path.join(__dirname, 'pipeline.js')} --schedule
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=africa-railways-pipeline
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;
  
  const servicePath = path.join(__dirname, 'africa-railways-pipeline.service');
  fs.writeFileSync(servicePath, service);
  
  console.log(`  Generated: ${servicePath}`);
  console.log('  To install:');
  console.log(`    sudo cp ${servicePath} /etc/systemd/system/`);
  console.log('    sudo systemctl daemon-reload');
  console.log('    sudo systemctl enable africa-railways-pipeline');
  console.log('    sudo systemctl start africa-railways-pipeline');
  
  return servicePath;
}

/**
 * Create logs directory
 */
function createLogsDirectory() {
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log(`\nCreated logs directory: ${logsDir}`);
  }
}

/**
 * Run full deployment check
 */
async function deploy() {
  console.log('');
  console.log('Africa Railways Data Integration - Deployment Check');
  console.log('='.repeat(55));
  console.log('');
  
  const results = {
    environment: null,
    dependencies: null,
    airtable: null,
    africoin: null,
    openai: null,
  };
  
  // Check environment
  results.environment = checkEnvironment();
  
  // Check dependencies
  results.dependencies = checkDependencies();
  
  // Install dependencies if missing
  if (!results.dependencies.valid) {
    console.log('\nInstalling missing dependencies...');
    try {
      execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
      results.dependencies.valid = true;
    } catch (error) {
      console.log('  Failed to install dependencies');
    }
  }
  
  // Test connections
  results.airtable = await testAirtableConnection();
  results.africoin = await testAfricoinConnection();
  results.openai = await testOpenAIConnection();
  
  // Create logs directory
  createLogsDirectory();
  
  // Generate deployment configs
  generatePM2Config();
  generateSystemdService();
  
  // Summary
  console.log('');
  console.log('='.repeat(55));
  console.log('Deployment Summary');
  console.log('='.repeat(55));
  
  const checks = [
    { name: 'Environment', result: results.environment.valid },
    { name: 'Dependencies', result: results.dependencies.valid },
    { name: 'Airtable', result: results.airtable.valid },
    { name: 'Africoin', result: results.africoin.valid || results.africoin.skipped },
    { name: 'OpenAI', result: results.openai.valid || results.openai.skipped },
  ];
  
  checks.forEach(check => {
    const icon = check.result ? '[OK]' : '[FAIL]';
    console.log(`  ${icon} ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.result);
  
  console.log('');
  if (allPassed) {
    console.log('Deployment ready!');
    console.log('');
    console.log('To start:');
    console.log('  Manual:    node pipeline.js');
    console.log('  Scheduled: node pipeline.js --schedule');
    console.log('  PM2:       pm2 start ecosystem.config.cjs');
  } else {
    console.log('Deployment has issues. Please fix the failed checks above.');
  }
  console.log('');
  
  return {
    ready: allPassed,
    results,
  };
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy()
    .then(result => {
      process.exit(result.ready ? 0 : 1);
    })
    .catch(error => {
      console.error('Deployment check failed:', error.message);
      process.exit(1);
    });
}

export { deploy, checkEnvironment, checkDependencies };
export default deploy;
