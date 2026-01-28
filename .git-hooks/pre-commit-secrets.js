#!/usr/bin/env node
/**
 * Pre-commit Hook for Detecting Secrets
 * 
 * Usage:
 * 1. Copy this file to .git/hooks/pre-commit
 * 2. chmod +x .git/hooks/pre-commit
 * 
 * This hook prevents committing files that contain secrets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns that indicate secrets
const SECRET_PATTERNS = [
  /STRIPE_SECRET_KEY\s*=\s*sk_/,
  /API_KEY\s*=\s*[A-Za-z0-9]{32,}/,
  /DATABASE_PASSWORD\s*=\s*/,
  /PRIVATE_KEY.*-----BEGIN/,
  /AWS_SECRET_ACCESS_KEY\s*=/,
  /TELEGRAM_BOT_TOKEN\s*=\s*\d+:/,
  /firebase-adminsdk.*\.json/,
  /google-play-.*\.json/,
  /-key\.json$/,
  /\.p12$/,
  /\.pem$/,
  /\.key$/
];

// Get staged files
let stagedFiles = [];
try {
  const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  stagedFiles = output.split('\n').filter(Boolean);
} catch (error) {
  console.error('Error getting staged files:', error.message);
  process.exit(1);
}

let hasSecrets = false;

// Check each staged file
for (const file of stagedFiles) {
  // Skip certain files
  if (
    file.includes('node_modules') ||
    file.includes('.git') ||
    file === '.env.example' ||
    file === 'SECURITY_FIXES_REPORT.md'
  ) {
    continue;
  }

  try {
    const content = fs.readFileSync(file, 'utf8');

    // Check for secret patterns
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`❌ SECURITY WARNING: Potential secret detected in ${file}`);
        console.error(`   Pattern: ${pattern}`);
        hasSecrets = true;
      }
    }

    // Check for common secret variable names with values
    if (
      /^\s*(API_KEY|SECRET|PASSWORD|TOKEN|KEY)\s*=\s*[A-Za-z0-9]{10,}/m.test(content) &&
      !file.endsWith('.example')
    ) {
      console.error(`❌ SECURITY WARNING: Potential secret in ${file}`);
      hasSecrets = true;
    }
  } catch (error) {
    // Skip binary files
    if (error.code !== 'EISDIR') {
      console.warn(`Warning: Could not read ${file}`);
    }
  }
}

if (hasSecrets) {
  console.error('\n⛔ COMMIT BLOCKED: Secrets detected!');
  console.error('');
  console.error('To fix:');
  console.error('1. Move secrets to .env file');
  console.error('2. Ensure .env is in .gitignore');
  console.error('3. Use .env.example for documentation only');
  console.error('');
  console.error('To bypass (not recommended):');
  console.error('  git commit --no-verify');
  process.exit(1);
}

console.log('✅ Pre-commit check passed - no secrets detected');
process.exit(0);
