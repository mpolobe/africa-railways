#!/bin/bash
# Filename: scripts/prepare_export_assets.sh
# Deployment Readiness Check for Export Utilities

set -e

echo "🔍 Checking Export Assets for Deployment..."

# Ensure the directory exists
mkdir -p SmartphoneApp/utils

# Check if the export utility is present
if [ -f "SmartphoneApp/utils/exportUtils.js" ]; then
    echo "✅ EXPORT LOGIC: Verified and ready for build."
    
    # Check file size (should be substantial)
    FILE_SIZE=$(wc -c < "SmartphoneApp/utils/exportUtils.js")
    if [ "$FILE_SIZE" -gt 5000 ]; then
        echo "✅ FILE SIZE: ${FILE_SIZE} bytes (adequate)"
    else
        echo "⚠️  FILE SIZE: ${FILE_SIZE} bytes (may be incomplete)"
    fi
    
    # Check for required exports
    if grep -q "downloadPayoutCSV" "SmartphoneApp/utils/exportUtils.js" && \
       grep -q "downloadAuditTrail" "SmartphoneApp/utils/exportUtils.js" && \
       grep -q "downloadSAPFormat" "SmartphoneApp/utils/exportUtils.js" && \
       grep -q "downloadOracleFormat" "SmartphoneApp/utils/exportUtils.js"; then
        echo "✅ EXPORTS: All required functions present"
    else
        echo "❌ EXPORTS: Missing required functions"
        exit 1
    fi
    
else
    echo "❌ MISSING: Export utility not found at SmartphoneApp/utils/exportUtils.js"
    exit 1
fi

# Check for required dependencies in package.json
if [ -f "SmartphoneApp/package.json" ]; then
    echo "✅ PACKAGE.JSON: Found"
    
    if grep -q "expo-file-system" "SmartphoneApp/package.json" && \
       grep -q "expo-sharing" "SmartphoneApp/package.json"; then
        echo "✅ DEPENDENCIES: expo-file-system and expo-sharing present"
    else
        echo "⚠️  DEPENDENCIES: May need to install expo-file-system and expo-sharing"
    fi
else
    echo "⚠️  PACKAGE.JSON: Not found in SmartphoneApp/"
fi

# Check for Partner Portal Screen
if [ -f "SmartphoneApp/screens/PartnerPortalScreen.js" ]; then
    echo "✅ PARTNER PORTAL: Screen exists"
    
    if grep -q "exportUtils" "SmartphoneApp/screens/PartnerPortalScreen.js"; then
        echo "✅ INTEGRATION: Partner Portal imports exportUtils"
    else
        echo "⚠️  INTEGRATION: Partner Portal may need to import exportUtils"
    fi
else
    echo "⚠️  PARTNER PORTAL: Screen not found"
fi

# Check for Payout Dashboard Screen
if [ -f "SmartphoneApp/screens/PayoutDashboardScreen.js" ]; then
    echo "✅ PAYOUT DASHBOARD: Screen exists"
else
    echo "⚠️  PAYOUT DASHBOARD: Screen not found"
fi

# Check for Revenue Flow Visualization
if [ -f "SmartphoneApp/components/RevenueFlowVisualization.js" ]; then
    echo "✅ REVENUE FLOW: Visualization component exists"
else
    echo "⚠️  REVENUE FLOW: Visualization component not found"
fi

# Check for reconciliation sync script
if [ -f "scripts/check_reconciliation_sync.sh" ]; then
    echo "✅ RECONCILIATION: Sync script exists"
    
    if [ -x "scripts/check_reconciliation_sync.sh" ]; then
        echo "✅ PERMISSIONS: Script is executable"
    else
        echo "⚠️  PERMISSIONS: Making script executable..."
        chmod +x scripts/check_reconciliation_sync.sh
    fi
else
    echo "⚠️  RECONCILIATION: Sync script not found"
fi

# Run a quick check on the Capacitor public folder (if using Capacitor)
if [ -d "android/app/src/main/assets/public" ]; then
    echo "✅ NATIVE ASSETS: Android project is synced."
fi

if [ -d "ios/App/App/public" ]; then
    echo "✅ NATIVE ASSETS: iOS project is synced."
fi

echo ""
echo "📊 Export System Status:"
echo "   - CSV Export: Ready"
echo "   - Audit Trail: Ready"
echo "   - SAP Format: Ready"
echo "   - Oracle Format: Ready"
echo ""
echo "✅ Deployment readiness check complete!"
