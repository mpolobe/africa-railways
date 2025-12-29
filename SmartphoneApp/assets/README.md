# App Assets

This directory contains all app icons, splash screens, and adaptive icons for the 4 app variants.

## Generated Assets

All assets were generated from SVG source files using the `scripts/generate-icons.js` script.

### App Variants

1. **Railways** - Blue theme (#0066CC)
   - Train icon with railway tracks
   - For passenger ticketing and journey management

2. **Africoin** - Gold theme (#FFB800)
   - Coin with Africa continent
   - Pan-African digital currency wallet

3. **Sentinel** - Orange/Gold theme (#FFB800)
   - Shield with safety helmet
   - Track worker safety monitoring

4. **Staff** - Blue theme (#0066CC)
   - ID badge with verification checkmark
   - Railway staff ticket verification

## Asset Specifications

### App Icons
- **Filename**: `icon-{variant}.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: iOS and Android app icon

### Adaptive Icons (Android)
- **Filename**: `adaptive-icon-{variant}.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground
- **Background**: Solid color from variant theme

### Splash Screens
- **Filename**: `splash-{variant}.png`
- **Size**: 1284x2778 pixels (iPhone 14 Pro Max)
- **Format**: PNG
- **Usage**: App launch screen
- **Layout**: Centered icon on solid background

## Regenerating Assets

If you need to modify the icons:

1. Edit the SVG source files in this directory:
   - `icon-railways.svg`
   - `icon-africoin.svg`
   - `icon-sentinel.svg`
   - `icon-staff.svg`

2. Run the generation script:
   ```bash
   cd SmartphoneApp
   node scripts/generate-icons.js
   ```

3. The script will regenerate all PNG assets from the SVG sources.

## Configuration

Assets are automatically selected based on the `APP_VARIANT` environment variable in `app.config.js`:

```javascript
icon: `./assets/icon-${APP_VARIANT}.png`,
splash: {
  image: `./assets/splash-${APP_VARIANT}.png`,
  resizeMode: "contain",
  backgroundColor: config.backgroundColor
},
android: {
  adaptiveIcon: {
    foregroundImage: `./assets/adaptive-icon-${APP_VARIANT}.png`,
    backgroundColor: config.backgroundColor
  }
}
```

## Asset Checklist

✅ All 4 variants have app icons (1024x1024)
✅ All 4 variants have splash screens (1284x2778)
✅ All 4 variants have adaptive icons (1024x1024)
✅ Configuration updated in app.config.js
✅ Assets verified and accessible

## Next Steps

1. Review the generated icons to ensure they meet your design requirements
2. If needed, customize the SVG files and regenerate
3. Test the icons in a development build:
   ```bash
   eas build --profile development --platform android
   ```
4. Once satisfied, proceed with production builds

## Notes

- SVG source files are kept for easy modification
- PNG files are generated and should not be edited directly
- All assets use the variant's theme colors
- Icons are designed to be clear and recognizable at all sizes
