#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes and reports on bundle sizes for the mobile app
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_SIZE_LIMITS = {
  total: 10 * 1024 * 1024, // 10MB
  js: 5 * 1024 * 1024,     // 5MB
  assets: 3 * 1024 * 1024   // 3MB
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeDirectory(dir) {
  let totalSize = 0;
  let jsSize = 0;
  let assetSize = 0;
  const files = [];

  function walkDir(currentPath) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const size = stat.size;
        totalSize += size;
        
        const ext = path.extname(item);
        if (ext === '.js' || ext === '.jsx') {
          jsSize += size;
        } else {
          assetSize += size;
        }
        
        files.push({
          path: path.relative(dir, fullPath),
          size: size,
          formatted: formatBytes(size)
        });
      }
    });
  }

  walkDir(dir);

  return {
    totalSize,
    jsSize,
    assetSize,
    files: files.sort((a, b) => b.size - a.size)
  };
}

function generateReport() {
  console.log('\n📦 Bundle Size Analysis\n');
  console.log('═'.repeat(60));

  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  No dist folder found. Run a build first.');
    console.log('   Run: expo export:web or eas build');
    return;
  }

  const analysis = analyzeDirectory(distPath);

  console.log('\n📊 Summary:');
  console.log('─'.repeat(60));
  console.log(`Total Size:  ${formatBytes(analysis.totalSize)}`);
  console.log(`JS Size:     ${formatBytes(analysis.jsSize)}`);
  console.log(`Asset Size:  ${formatBytes(analysis.assetSize)}`);

  // Check limits
  console.log('\n🎯 Size Limits:');
  console.log('─'.repeat(60));
  
  const totalStatus = analysis.totalSize <= BUNDLE_SIZE_LIMITS.total ? '✅' : '❌';
  const jsStatus = analysis.jsSize <= BUNDLE_SIZE_LIMITS.js ? '✅' : '❌';
  const assetStatus = analysis.assetSize <= BUNDLE_SIZE_LIMITS.assets ? '✅' : '❌';

  console.log(`${totalStatus} Total:  ${formatBytes(analysis.totalSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.total)}`);
  console.log(`${jsStatus} JS:     ${formatBytes(analysis.jsSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.js)}`);
  console.log(`${assetStatus} Assets: ${formatBytes(analysis.assetSize)} / ${formatBytes(BUNDLE_SIZE_LIMITS.assets)}`);

  // Top 10 largest files
  console.log('\n📁 Top 10 Largest Files:');
  console.log('─'.repeat(60));
  analysis.files.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.formatted.padEnd(10)} ${file.path}`);
  });

  // Fail if over limit
  if (analysis.totalSize > BUNDLE_SIZE_LIMITS.total) {
    console.log('\n❌ Bundle size exceeds limit!');
    console.log(`   Reduce bundle size by ${formatBytes(analysis.totalSize - BUNDLE_SIZE_LIMITS.total)}`);
    process.exit(1);
  }

  console.log('\n✅ Bundle size within limits');
  console.log('═'.repeat(60));
}

// Run analysis
generateReport();
