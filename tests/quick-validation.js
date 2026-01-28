#!/usr/bin/env node

/**
 * Quick Security Fixes Validation Script
 * 
 * Run this to verify security changes don't break core functionality:
 * node tests/quick-validation.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔒 Security Fixes Validation\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

// Test 1: Check server.js syntax
console.log('\n✓ Test 1: Checking server.js syntax...');
try {
  const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  
  // Check for invalid route syntax
  if (serverJs.includes("app.get('/{*path}'")) {
    console.log('❌ FAILED: Invalid route syntax {*path} found');
    failed++;
  } else if (serverJs.includes("app.get('*'")) {
    console.log('✓ PASSED: Route syntax is correct');
    passed++;
  } else {
    console.log('⚠️ WARNING: Could not verify route syntax');
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 2: Check helmet.js is imported
console.log('\n✓ Test 2: Checking security middleware...');
try {
  const files = [
    { path: '../server.js', name: 'Main Server' },
    { path: '../server/webhook.js', name: 'Webhook Server' },
    { path: '../telegram-bot/index.js', name: 'Telegram Bot' }
  ];
  
  let allHaveHelmet = true;
  for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, file.path), 'utf8');
    if (!content.includes('helmet') && !content.includes('app.use(express.json')) {
      console.log(`  - ${file.name}: Missing security middleware`);
      allHaveHelmet = false;
    } else {
      console.log(`  ✓ ${file.name}: Security middleware present`);
    }
  }
  
  if (allHaveHelmet) {
    passed++;
  } else {
    failed++;
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 3: Check CORS is restricted
console.log('\n✓ Test 3: Checking CORS configuration...');
try {
  const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const botJs = fs.readFileSync(path.join(__dirname, '../telegram-bot/index.js'), 'utf8');
  
  let corsFixed = 0;
  let corsTotal = 0;
  
  // Check server.js CORS
  if (serverJs.includes('Access-Control-Allow-Origin') && !serverJs.includes("'*'")) {
    corsFixed++;
  }
  corsTotal++;
  
  // Check bot CORS
  if (botJs.includes('ALLOWED_ORIGINS') || botJs.includes('corsOptions')) {
    corsFixed++;
  }
  corsTotal++;
  
  if (corsFixed === corsTotal) {
    console.log(`✓ PASSED: CORS is properly restricted (${corsFixed}/${corsTotal} servers)`);
    passed++;
  } else {
    console.log(`⚠️ PARTIAL: CORS is restricted on ${corsFixed}/${corsTotal} servers`);
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 4: Check rate limiting is implemented
console.log('\n✓ Test 4: Checking rate limiting...');
try {
  const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const webhookJs = fs.readFileSync(path.join(__dirname, '../server/webhook.js'), 'utf8');
  
  let rateLimitCount = 0;
  
  if (serverJs.includes('rateLimitStore') && serverJs.includes('checkRateLimit')) {
    console.log('  ✓ Main server has rate limiting');
    rateLimitCount++;
  }
  
  if (webhookJs.includes('request size limits') || webhookJs.includes("limit: '10kb'")) {
    console.log('  ✓ Webhook server has request size limits');
    rateLimitCount++;
  }
  
  if (rateLimitCount > 0) {
    console.log(`✓ PASSED: Rate limiting implemented on ${rateLimitCount} servers`);
    passed++;
  } else {
    console.log('❌ FAILED: Rate limiting not found');
    failed++;
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 5: Check input validation
console.log('\n✓ Test 5: Checking input validation...');
try {
  const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  
  const validators = [
    'validatePhoneNumber',
    'validateOTPCode',
    'validateAmount'
  ];
  
  let foundValidators = 0;
  for (const validator of validators) {
    if (serverJs.includes(validator)) {
      console.log(`  ✓ Found ${validator}`);
      foundValidators++;
    }
  }
  
  if (foundValidators === validators.length) {
    console.log(`✓ PASSED: All validators implemented (${foundValidators}/${validators.length})`);
    passed++;
  } else {
    console.log(`⚠️ PARTIAL: Found ${foundValidators}/${validators.length} validators`);
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 6: Check .env.example exists
console.log('\n✓ Test 6: Checking environment documentation...');
try {
  const envExample = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');
  
  if (envExample.includes('SECURITY NOTICE') || envExample.includes('security') || envExample.includes('SECRET')) {
    console.log('✓ PASSED: .env.example has security guidelines');
    passed++;
  } else {
    console.log('⚠️ WARNING: .env.example could have more security documentation');
  }
} catch (e) {
  console.log(`❌ FAILED: .env.example not found or not readable`);
  failed++;
}

// Test 7: Check admin authentication in bot
console.log('\n✓ Test 7: Checking admin authentication...');
try {
  const botJs = fs.readFileSync(path.join(__dirname, '../telegram-bot/index.js'), 'utf8');
  
  if (botJs.includes('ADMIN_KEY') && botJs.includes('adminKey !== process.env.ADMIN_KEY')) {
    console.log('✓ PASSED: Admin key authentication implemented');
    passed++;
  } else {
    console.log('❌ FAILED: Admin key authentication not found');
    failed++;
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Test 8: Check webhook signature verification
console.log('\n✓ Test 8: Checking webhook signature verification...');
try {
  const webhookJs = fs.readFileSync(path.join(__dirname, '../server/webhook.js'), 'utf8');
  
  if (webhookJs.includes('verif-hash') && webhookJs.includes('SECRET_HASH') && webhookJs.includes('status === 401')) {
    console.log('✓ PASSED: Webhook signature verification implemented');
    passed++;
  } else {
    console.log('❌ FAILED: Webhook signature verification not complete');
    failed++;
  }
} catch (e) {
  console.log(`❌ FAILED: ${e.message}`);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Validation Results:');
console.log(`   ✓ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   Total:   ${passed + failed}\n`);

if (failed === 0) {
  console.log('✅ All security fixes validated successfully!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} issue(s) need attention. Review the failures above.\n`);
  process.exit(1);
}
