#!/bin/bash

# 1. Path Definitions
PACKAGE_PATH="/workspaces/africa-railways/railway"
APP_JS_PATH="/workspaces/africa-railways/SmartphoneApp/App.js"
OUTPUT_JSON="/tmp/publish-results.json"

echo "=== 🏗️ Deploying Africa Railways Smart Contract ==="

# 2. Publish to Sui (Localnet) and capture JSON output
# We use --json to make the output machine-readable
sui client publish --gas-budget 100000000 "$PACKAGE_PATH" --json > "$OUTPUT_JSON"

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed. Check your Sui node or gas balance."
    exit 1
fi

# 3. Extract the Package ID using grep and sed
# The Package ID is found in objectChanges where type is "published"
NEW_PACKAGE_ID=$(grep -oP '"packageId":"\K0x[a-fA-F0-0]+' "$OUTPUT_JSON" | head -1)

if [ -z "$NEW_PACKAGE_ID" ]; then
    echo "❌ Failed to extract Package ID from deployment output."
    exit 1
fi

echo "✅ Published successfully! New Package ID: $NEW_PACKAGE_ID"

# 4. Inject the ID into the React Native App.js
# This searches for the PACKAGE_ID constant and replaces its value
sed -i "s/const PACKAGE_ID = \".*\";/const PACKAGE_ID = \"$NEW_PACKAGE_ID\";/" "$APP_JS_PATH"

echo "📱 Frontend updated: $APP_JS_PATH"
echo "=== 🏁 Deployment Complete ==="
