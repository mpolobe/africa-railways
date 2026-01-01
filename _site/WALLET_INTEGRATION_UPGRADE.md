# Wallet Integration Upgrade Guide

## Overview

Based on research from suilab.fun and official Sui documentation, this guide upgrades our investor portal to use the official `@mysten/dapp-kit` for professional wallet integration.

## Current vs. Improved Implementation

### Current (investor.html)
- ❌ Manual wallet detection via `window.suiWallet`
- ❌ No wallet selection UI
- ❌ Limited error handling
- ❌ No auto-reconnect
- ❌ Manual transaction building

### Improved (Using @mysten/dapp-kit)
- ✅ Official Sui dApp Kit
- ✅ Multi-wallet support (Sui Wallet, Suiet, Ethos, Slush)
- ✅ Pre-built ConnectButton component
- ✅ Auto-reconnect on page load
- ✅ Proper transaction building with PTBs
- ✅ React Query integration
- ✅ Theme customization

---

## Installation

### Option 1: React App (Recommended)

```bash
# Create new React app with Sui dApp Kit
npx @mysten/create-dapp

# Or add to existing React app
npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query
```

### Option 2: Standalone HTML (Current Setup)

```html
<!-- Add to investor.html -->
<script crossorigin src="https://unpkg.com/@mysten/dapp-kit@latest/dist/index.umd.js"></script>
<script crossorigin src="https://unpkg.com/@mysten/sui@latest/dist/index.umd.js"></script>
<script crossorigin src="https://unpkg.com/@tanstack/react-query@latest/dist/index.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@mysten/dapp-kit@latest/dist/index.css">
```

---

## Implementation

### 1. Setup Providers (React)

```typescript
// App.tsx
import { 
  createNetworkConfig, 
  SuiClientProvider, 
  WalletProvider 
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// Configure networks
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} 
        defaultNetwork="mainnet"
      >
        <WalletProvider
          autoConnect={true}
          slushWallet={{
            name: 'ARAIL Investor Portal'
          }}
        >
          <InvestorPortal />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
```

### 2. Connect Button Component

```typescript
// components/WalletConnect.tsx
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletConnect() {
  const account = useCurrentAccount();

  return (
    <div>
      <ConnectButton />
      {account && (
        <div className="mt-4">
          <p>Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}</p>
        </div>
      )}
    </div>
  );
}
```

### 3. Investment Transaction

```typescript
// components/InvestmentForm.tsx
import { 
  useSignAndExecuteTransaction, 
  useCurrentAccount 
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function InvestmentForm() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [amount, setAmount] = useState(500);

  const handleInvest = () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    // Create transaction
    const tx = new Transaction();

    // Split coins for payment (amount in MIST)
    const [coin] = tx.splitCoins(tx.gas, [
      tx.pure.u64(amount * 1_000_000_000)
    ]);

    // Call investment contract
    tx.moveCall({
      target: `${PACKAGE_ID}::investment::invest`,
      arguments: [
        tx.object(TREASURY_ID),  // Treasury
        coin,                     // Payment
        tx.object('0x6'),        // Clock
      ],
    });

    // Sign and execute
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Investment successful:', result.digest);
          alert(`✅ Investment confirmed! TX: ${result.digest.slice(0, 10)}...`);
        },
        onError: (error) => {
          console.error('Investment failed:', error);
          alert(`❌ Investment failed: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="investment-form">
      <h2>Invest in $SENT</h2>
      
      <div className="amount-selector">
        <label>Amount (SUI)</label>
        <input 
          type="range" 
          min="100" 
          max="10000" 
          step="100"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <span>{amount} SUI</span>
      </div>

      <div className="investment-details">
        <p>USD Value: ${(amount * 1.44).toFixed(2)}</p>
        <p>Equity: {((amount / 350000) * 10).toFixed(4)}%</p>
        <p>Vesting: 12 months linear</p>
      </div>

      <button 
        onClick={handleInvest}
        disabled={!account}
        className="invest-button"
      >
        {account ? `Invest ${amount} SUI` : 'Connect Wallet First'}
      </button>
    </div>
  );
}
```

### 4. Check Balance

```typescript
// components/BalanceChecker.tsx
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

export function BalanceChecker() {
  const account = useCurrentAccount();

  // Query user's objects (looking for InvestmentCertificate)
  const { data: objects } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: {
        StructType: `${PACKAGE_ID}::investment::InvestmentCertificate`
      },
      options: {
        showContent: true,
      }
    },
    {
      enabled: !!account,
    }
  );

  if (!account) {
    return <p>Connect wallet to view balance</p>;
  }

  if (!objects || objects.data.length === 0) {
    return <p>No investments found</p>;
  }

  return (
    <div className="balance-display">
      <h3>Your Investments</h3>
      {objects.data.map((obj) => {
        const cert = obj.data?.content?.fields;
        return (
          <div key={obj.data.objectId} className="certificate-card">
            <p>Certificate #{cert.certificate_number}</p>
            <p>Invested: {(cert.sui_invested / 1_000_000_000).toFixed(2)} SUI</p>
            <p>Equity Tokens: {cert.equity_tokens.toLocaleString()}</p>
            <p>Claimed: {cert.total_claimed.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
```

### 5. Claim Vested Tokens

```typescript
// components/ClaimTokens.tsx
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export function ClaimTokens({ certificateId }: { certificateId: string }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleClaim = () => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::investment::claim_tokens`,
      arguments: [
        tx.object(certificateId),  // Certificate
        tx.object('0x6'),          // Clock
      ],
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          alert(`✅ Tokens claimed! TX: ${result.digest.slice(0, 10)}...`);
        },
        onError: (error) => {
          alert(`❌ Claim failed: ${error.message}`);
        },
      }
    );
  };

  return (
    <button onClick={handleClaim} className="claim-button">
      Claim Vested Tokens
    </button>
  );
}
```

---

## Wallet Selection UI

The dApp Kit provides a built-in wallet selection modal:

```typescript
import { ConnectButton } from '@mysten/dapp-kit';

// Simple usage
<ConnectButton />

// Custom styling
<ConnectButton 
  className="custom-connect-button"
  connectText="Connect to ARAIL"
/>
```

Supported wallets (auto-detected):
- Sui Wallet
- Suiet Wallet
- Ethos Wallet
- Slush Wallet
- Martian Wallet
- Glass Wallet
- Morphis Wallet
- Nightly Wallet

---

## Slush Wallet Integration

Slush is a social wallet that allows users to connect via email/social login:

```typescript
<WalletProvider
  slushWallet={{
    name: 'ARAIL Investor Portal',
  }}
>
  {children}
</WalletProvider>
```

Benefits:
- No seed phrase required
- Email/Google/Apple login
- Perfect for non-crypto users
- Seamless onboarding

---

## Migration Path

### Phase 1: Create React Version (Recommended)

```bash
# Create new React app
npx @mysten/create-dapp

# Copy components
cp investor.html src/pages/Investor.tsx

# Refactor to use dApp Kit hooks
# Deploy to Vercel
```

### Phase 2: Update Existing HTML (Quick Fix)

```html
<!-- investor.html -->
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@mysten/dapp-kit@latest/dist/index.umd.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/@mysten/dapp-kit@latest/dist/index.css">
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { WalletProvider, ConnectButton, useCurrentAccount } = window.DappKit;
        
        function InvestorPortal() {
            const account = useCurrentAccount();
            
            return (
                <div>
                    <ConnectButton />
                    {account && <InvestmentForm account={account} />}
                </div>
            );
        }
        
        ReactDOM.render(
            <WalletProvider>
                <InvestorPortal />
            </WalletProvider>,
            document.getElementById('root')
        );
    </script>
</body>
</html>
```

---

## Testing

### 1. Test Wallet Connection

```typescript
import { useCurrentAccount, useWallets } from '@mysten/dapp-kit';

function WalletTest() {
  const account = useCurrentAccount();
  const wallets = useWallets();

  return (
    <div>
      <h3>Available Wallets:</h3>
      <ul>
        {wallets.map(wallet => (
          <li key={wallet.name}>{wallet.name}</li>
        ))}
      </ul>
      
      {account && (
        <div>
          <p>Connected: {account.address}</p>
          <p>Chains: {account.chains.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Test Transaction

```bash
# Use Sui Wallet on testnet
# Connect to https://africarailways.com/investor
# Click "Invest 100 SUI"
# Approve transaction in wallet
# Verify transaction on Sui Explorer
```

---

## Best Practices

### 1. Error Handling

```typescript
const { mutate: signAndExecute, isPending, error } = useSignAndExecuteTransaction();

if (isPending) {
  return <div>Transaction pending...</div>;
}

if (error) {
  return <div>Error: {error.message}</div>;
}
```

### 2. Loading States

```typescript
const { data, isPending } = useSuiClientQuery('getOwnedObjects', {
  owner: account?.address || '',
});

if (isPending) {
  return <Spinner />;
}
```

### 3. Auto-Reconnect

```typescript
<WalletProvider autoConnect={true}>
  {children}
</WalletProvider>
```

### 4. Network Switching

```typescript
import { useSuiClient } from '@mysten/dapp-kit';

const client = useSuiClient();
// Automatically uses the correct network
```

---

## Comparison: suilab.fun vs. ARAIL

### suilab.fun Approach

```typescript
// Simple connect button
<ConnectButton />

// Transaction building
const tx = new Transaction();
tx.moveCall({
  target: '0x2::coin::mint',
  arguments: [...]
});
```

### ARAIL Approach (Enhanced)

```typescript
// Connect with Slush support
<WalletProvider slushWallet={{ name: 'ARAIL' }}>
  <ConnectButton />
</WalletProvider>

// Investment-specific transaction
const tx = new Transaction();
const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1e9)]);
tx.moveCall({
  target: `${PACKAGE_ID}::investment::invest`,
  arguments: [tx.object(TREASURY_ID), coin, tx.object('0x6')],
});
```

---

## Production Checklist

- [ ] Install @mysten/dapp-kit
- [ ] Set up providers (SuiClientProvider, WalletProvider)
- [ ] Replace manual wallet connection with ConnectButton
- [ ] Update transaction building to use Transaction class
- [ ] Add error handling and loading states
- [ ] Enable auto-reconnect
- [ ] Configure Slush wallet
- [ ] Test on testnet
- [ ] Deploy to mainnet
- [ ] Update documentation

---

## Resources

- **Sui dApp Kit**: https://sdk.mystenlabs.com/dapp-kit
- **suilab.fun**: https://suilab.fun (reference implementation)
- **Sui Wallet Standard**: https://github.com/MystenLabs/sui/tree/main/sdk/wallet-standard
- **Transaction Building**: https://docs.sui.io/guides/developer/sui-101/building-ptb
- **Slush Wallet**: https://sdk.mystenlabs.com/dapp-kit/slush

---

**Next Steps:**
1. Create React version of investor portal
2. Integrate @mysten/dapp-kit
3. Test with multiple wallets
4. Deploy to production

**Status:** Ready for implementation  
**Priority:** High (improves UX significantly)  
**Effort:** 2-3 hours for React migration
