#!/usr/bin/env node

/**
 * Generate App Icons from SVG
 * 
 * This script converts SVG icons to PNG format for all app variants.
 * It uses sharp library for image processing.
 * 
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp library not found. Installing...');
  console.log('Run: npm install --save-dev sharp');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const VARIANTS = ['railways', 'africoin', 'sentinel', 'staff'];

// Icon sizes needed
const ICON_SIZES = {
  'icon.png': 1024,           // App icon (iOS and Android)
  'adaptive-icon.png': 1024,  // Android adaptive icon
  'splash.png': 1284,         // Splash screen (will be 1284x2778)
};

async function generateIcons() {
  console.log('🎨 Generating app icons...\n');

  for (const variant of VARIANTS) {
    console.log(`📱 Processing ${variant}...`);
    
    const svgPath = path.join(ASSETS_DIR, `icon-${variant}.svg`);
    
    if (!fs.existsSync(svgPath)) {
      console.error(`  ❌ SVG not found: ${svgPath}`);
      continue;
    }

    try {
      // Read SVG
      const svgBuffer = fs.readFileSync(svgPath);

      // Generate icon.png (1024x1024)
      await sharp(svgBuffer)
        .resize(1024, 1024)
        .png()
        .toFile(path.join(ASSETS_DIR, `icon-${variant}.png`));
      console.log(`  ✅ Generated icon-${variant}.png (1024x1024)`);

      // Generate adaptive-icon.png (1024x1024)
      await sharp(svgBuffer)
        .resize(1024, 1024)
        .png()
        .toFile(path.join(ASSETS_DIR, `adaptive-icon-${variant}.png`));
      console.log(`  ✅ Generated adaptive-icon-${variant}.png (1024x1024)`);

      // Generate splash screen (1284x2778 - iPhone 14 Pro Max)
      // We'll create a centered version with background color
      const backgroundColor = getBackgroundColor(variant);
      
      await sharp({
        create: {
          width: 1284,
          height: 2778,
          channels: 4,
          background: backgroundColor
        }
      })
      .composite([{
        input: await sharp(svgBuffer).resize(800, 800).png().toBuffer(),
        top: Math.floor((2778 - 800) / 2),
        left: Math.floor((1284 - 800) / 2)
      }])
      .png()
      .toFile(path.join(ASSETS_DIR, `splash-${variant}.png`));
      console.log(`  ✅ Generated splash-${variant}.png (1284x2778)`);

    } catch (error) {
      console.error(`  ❌ Error processing ${variant}:`, error.message);
    }

    console.log('');
  }

  console.log('✅ Icon generation complete!\n');
  console.log('📝 Next steps:');
  console.log('1. Review the generated icons in SmartphoneApp/assets/');
  console.log('2. Update app.config.js to use the correct icon for each variant');
  console.log('3. Run: eas build --profile development --platform android');
}

function getBackgroundColor(variant) {
  const colors = {
    railways: { r: 0, g: 102, b: 204, alpha: 1 },    // #0066CC
    africoin: { r: 255, g: 184, b: 0, alpha: 1 },    // #FFB800
    sentinel: { r: 255, g: 184, b: 0, alpha: 1 },    // #FFB800
    staff: { r: 0, g: 102, b: 204, alpha: 1 }        // #0066CC
  };
  return colors[variant] || { r: 255, g: 255, b: 255, alpha: 1 };
}

// Run the script
generateIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
