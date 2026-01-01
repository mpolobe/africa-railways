# Dependency Fixes for CodeMagic Build

## Issues Resolved

### 1. React Version Conflict
**Problem**: `react-test-renderer@18.3.1` required `react@^18.3.1` but project had `react@18.2.0`

**Solution**:
- Pinned `react-test-renderer` to exact version `18.2.0` to match React version
- Added `react-test-renderer: "18.2.0"` to resolutions

### 2. Deprecated @mysten/sui.js Package
**Problem**: Package renamed from `@mysten/sui.js` to `@mysten/sui`

**Solution**:
- Updated package.json: `@mysten/sui.js@^0.54.1` → `@mysten/sui@^1.14.2`
- Updated imports in App.js:
  - `@mysten/sui.js/transactions` → `@mysten/sui/transactions`
  - `@mysten/sui.js/client` → `@mysten/sui/client`
  - `TransactionBlock` → `Transaction`
- Updated mocks in jest.setup.js and __tests__/App.test.js

### 3. Deprecated Testing Library
**Problem**: `@testing-library/jest-native@5.4.3` is deprecated

**Solution**:
- Removed `@testing-library/jest-native` (matchers now built into react-native-testing-library)
- Updated `@testing-library/react-native` to `^12.8.1` (includes built-in matchers)

### 4. React Native Version Pinning
**Problem**: Inconsistent version resolution

**Solution**:
- Changed `react-native: "^0.73.11"` to exact version `"0.73.11"`
- Added to resolutions for consistency

## Updated package.json

```json
{
  "dependencies": {
    "@mysten/sui": "^1.14.2",  // was @mysten/sui.js
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.73.11"  // exact version
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.8.1",  // updated
    "react-test-renderer": "18.2.0"  // exact version
  },
  "resolutions": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.73.11",
    "react-test-renderer": "18.2.0"  // added
  }
}
```

## Babel Plugin Warnings

The following warnings are from transitive dependencies and can be safely ignored:
- `@babel/plugin-proposal-*` packages (handled by babel-preset-expo)
- `abab`, `domexception`, `node-domexception` (platform natives available)
- `rimraf@2.6.3` (transitive dependency, not directly used)
- `sudo-prompt` (not used in our codebase)

These are managed by Expo's preset and will be updated when Expo updates its dependencies.

## Installation Command

For CodeMagic, use:
```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag handles any remaining peer dependency warnings from transitive dependencies.

## Verification

After installation, verify with:
```bash
npm ls react react-dom react-native @mysten/sui
```

Should show:
- react@18.2.0
- react-dom@18.2.0
- react-native@0.73.11
- @mysten/sui@1.14.2

## Migration Notes

### For @mysten/sui Migration

If you have other files using the old package:

**Old:**
```javascript
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';

const tx = new TransactionBlock();
```

**New:**
```javascript
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

const tx = new Transaction();
```

### For Testing Library Migration

**Old:**
```javascript
import '@testing-library/jest-native/extend-expect';
```

**New:**
```javascript
// No import needed - matchers are built-in to @testing-library/react-native@12.4+
```

## Build Status

These fixes resolve:
- ✅ React version conflicts
- ✅ Deprecated package warnings
- ✅ Peer dependency errors
- ✅ Testing library deprecation

The build should now complete successfully on CodeMagic.
