# 🏗️ Blockchain Architecture - Source of Truth

## Overview

The Africa Railways system uses a **dual-blockchain architecture** where each blockchain serves a specific purpose.

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USSD Purchase                            │
│                         ↓                                   │
│                    Backend API                              │
│                         ↓                                   │
│              ┌──────────┴──────────┐                        │
│              ↓                     ↓                        │
│         Sui (Fast)          Polygon (Authority)             │
│    Event Trigger Only      Source of Truth                  │
│    Real-time updates       NFT Ownership                    │
│         ↓                          ↓                        │
│    Dashboard              Staff Verification                │
│    Live Feed              Gate Scanning                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Principle: Polygon is the Source of Truth

### Why Polygon?

**The NFT on Polygon is the actual legal "ticket"**

1. **Finality of Ownership**
   - NFT represents legal ownership
   - Transferable between wallets
   - Immutable proof of purchase
   - Verifiable on-chain

2. **Alchemy's Performance**
   - Optimized NFT API
   - Fast `getNftsForOwner` queries
   - Better than manual ledger crawling
   - Enterprise-grade reliability

3. **Gasless Minting**
   - Gas Policy enables free minting
   - Scalable for high volume
   - No user friction
   - Cost-effective operations

### Why Sui?

**Sui acts as the fast "event trigger" for your backend**

1. **Real-time Updates**
   - Instant event notifications
   - Fast transaction finality
   - Low latency updates
   - Dashboard live feed

2. **Event Streaming**
   - Trigger backend workflows
   - Update dashboards
   - Send notifications
   - Analytics tracking

3. **Not for Verification**
   - ❌ Don't check Sui for ticket validity
   - ❌ Don't use Sui for gate scanning
   - ✅ Use Sui for events only
   - ✅ Use Polygon for verification

---

## ⚠️ Why This Change is Necessary

### Problem: Checking Only Sui

If you only check Sui, you might miss:

1. **Transferred Tickets**
   - Passenger transfers NFT to another wallet
   - Sui event doesn't reflect transfer
   - Gate scanner shows invalid ticket
   - Passenger denied boarding

2. **Invalidated Tickets**
   - Ticket refunded on Polygon
   - NFT burned or transferred back
   - Sui still shows original event
   - System allows duplicate boarding

3. **Ownership Changes**
   - NFT sold on secondary market
   - New owner has valid ticket
   - Sui doesn't track ownership
   - Wrong person verified

### Solution: Query Polygon

**Always verify against Polygon blockchain:**

1. **Check NFT Ownership**
   ```javascript
   // Get NFTs owned by passenger
   const nfts = await alchemy.nft.getNftsForOwner(passengerAddress);
   
   // Verify ticket NFT exists
   const hasTicket = nfts.ownedNfts.some(nft => 
     nft.contract.address === TICKET_CONTRACT &&
     nft.tokenId === ticketId
   );
   ```

2. **Verify Metadata**
   ```javascript
   // Get NFT metadata
   const metadata = await alchemy.nft.getNftMetadata(
     TICKET_CONTRACT,
     ticketId
   );
   
   // Check ticket details
   const route = metadata.rawMetadata.attributes.find(
     a => a.trait_type === 'Route'
   ).value;
   ```

3. **Check Transfer History**
   ```javascript
   // Get transfer history
   const transfers = await alchemy.nft.getTransfersForOwner(
     passengerAddress,
     { contractAddresses: [TICKET_CONTRACT] }
   );
   
   // Verify current ownership
   const currentOwner = transfers[0].to;
   ```

---

## 🔄 Data Flow

### Ticket Purchase Flow

```
1. Passenger buys ticket via USSD
   ↓
2. Backend creates metadata
   ↓
3. Upload to IPFS
   ↓
4. Mint NFT on Polygon (Source of Truth)
   ↓
5. Emit event on Sui (Fast notification)
   ↓
6. Dashboard updates (from Sui event)
   ↓
7. Passenger receives ticket
```

### Ticket Verification Flow

```
1. Staff scans QR code at gate
   ↓
2. Extract ticket ID and passenger address
   ↓
3. Query Polygon via Alchemy ← SOURCE OF TRUTH
   ↓
4. Check NFT ownership
   ↓
5. Verify metadata (route, seat, etc.)
   ↓
6. Display result to staff
   ↓
7. Mark as used (if valid)
   ↓
8. Log to backend
```

---

## 🚀 Updated Implementation

### Configuration (Load from root config.json)

```javascript
// Load from /config.json
import config from '../../config.json';

const ALCHEMY_CONFIG = {
  apiKey: config.blockchain.polygon_endpoint.split('/').pop(),
  network: config.blockchain.network, // "polygon-amoy"
  contractAddress: config.contracts.ticket_nft
};

const ALCHEMY_URL = config.blockchain.polygon_endpoint;
```

### Staff App - Verification Logic

```javascript
import { Alchemy, Network } from 'alchemy-sdk';

// Initialize Alchemy
const alchemy = new Alchemy({
  apiKey: ALCHEMY_CONFIG.apiKey,
  network: Network.MATIC_AMOY // Polygon Amoy testnet
});

/**
 * Verify ticket ownership on Polygon
 * This is the SOURCE OF TRUTH
 */
async function verifyTicketOnPolygon(ticketId, passengerAddress) {
  try {
    // Method 1: Get NFT metadata
    const nft = await alchemy.nft.getNftMetadata(
      ALCHEMY_CONFIG.contractAddress,
      ticketId
    );
    
    if (!nft) {
      return {
        valid: false,
        reason: 'Ticket not found on Polygon blockchain'
      };
    }
    
    // Method 2: Verify ownership
    const owner = await alchemy.nft.getOwnersForNft(
      ALCHEMY_CONFIG.contractAddress,
      ticketId
    );
    
    const isOwner = owner.owners.includes(passengerAddress.toLowerCase());
    
    if (!isOwner) {
      return {
        valid: false,
        reason: 'Passenger does not own this ticket',
        currentOwner: owner.owners[0]
      };
    }
    
    // Method 3: Check if ticket was used
    const isUsed = await checkIfTicketUsed(ticketId);
    
    if (isUsed) {
      return {
        valid: false,
        reason: 'Ticket already used',
        usedAt: isUsed.timestamp,
        usedBy: isUsed.staffId
      };
    }
    
    // Ticket is valid!
    return {
      valid: true,
      nft: nft,
      metadata: nft.rawMetadata,
      owner: passengerAddress,
      tokenId: ticketId
    };
    
  } catch (error) {
    console.error('Polygon verification failed:', error);
    return {
      valid: false,
      reason: 'Verification error: ' + error.message
    };
  }
}

/**
 * Get all tickets owned by passenger
 * Useful for checking if passenger has any valid tickets
 */
async function getPassengerTickets(passengerAddress) {
  try {
    const nfts = await alchemy.nft.getNftsForOwner(passengerAddress, {
      contractAddresses: [ALCHEMY_CONFIG.contractAddress]
    });
    
    return nfts.ownedNfts.map(nft => ({
      tokenId: nft.tokenId,
      metadata: nft.rawMetadata,
      contractAddress: nft.contract.address
    }));
    
  } catch (error) {
    console.error('Failed to get passenger tickets:', error);
    return [];
  }
}

/**
 * Check ticket transfer history
 * Verify ticket wasn't transferred or sold
 */
async function getTicketHistory(ticketId) {
  try {
    const transfers = await alchemy.core.getAssetTransfers({
      contractAddresses: [ALCHEMY_CONFIG.contractAddress],
      category: ['erc721'],
      order: 'desc'
    });
    
    const ticketTransfers = transfers.transfers.filter(
      t => t.tokenId === ticketId
    );
    
    return ticketTransfers;
    
  } catch (error) {
    console.error('Failed to get ticket history:', error);
    return [];
  }
}
```

### React Native Component

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { Alchemy, Network } from 'alchemy-sdk';

// Load config from root
import config from '../../config.json';

const ScanTicketScreen = ({ navigation }) => {
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  
  // Initialize Alchemy
  const alchemy = new Alchemy({
    apiKey: config.blockchain.polygon_endpoint.split('/').pop(),
    network: Network.MATIC_AMOY
  });
  
  const handleBarCodeScanned = async ({ data }) => {
    if (!scanning || verifying) return;
    
    setScanning(false);
    setVerifying(true);
    
    try {
      // Parse QR code data
      // Format: "TKT1024|0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
      const [ticketId, passengerAddress] = data.split('|');
      
      console.log('Verifying on Polygon (Source of Truth)...');
      console.log('Ticket ID:', ticketId);
      console.log('Passenger:', passengerAddress);
      
      // CRITICAL: Verify on Polygon, not Sui
      const verification = await verifyTicketOnPolygon(
        ticketId,
        passengerAddress
      );
      
      setResult(verification);
      
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        valid: false,
        reason: 'Verification failed: ' + error.message
      });
    } finally {
      setVerifying(false);
    }
  };
  
  const verifyTicketOnPolygon = async (ticketId, passengerAddress) => {
    // Get NFT metadata from Polygon
    const nft = await alchemy.nft.getNftMetadata(
      config.contracts.ticket_nft,
      ticketId
    );
    
    if (!nft) {
      return {
        valid: false,
        reason: 'Ticket not found on Polygon blockchain'
      };
    }
    
    // Verify ownership
    const owners = await alchemy.nft.getOwnersForNft(
      config.contracts.ticket_nft,
      ticketId
    );
    
    const isOwner = owners.owners.some(
      owner => owner.toLowerCase() === passengerAddress.toLowerCase()
    );
    
    if (!isOwner) {
      return {
        valid: false,
        reason: 'Passenger does not own this ticket',
        currentOwner: owners.owners[0]
      };
    }
    
    // Check if already used (from local cache or backend)
    const isUsed = await checkIfTicketUsed(ticketId);
    if (isUsed) {
      return {
        valid: false,
        reason: 'Ticket already used',
        usedAt: isUsed.timestamp
      };
    }
    
    // Valid ticket!
    return {
      valid: true,
      nft: nft,
      metadata: nft.rawMetadata,
      owner: passengerAddress,
      tokenId: ticketId,
      verifiedOn: 'Polygon',
      blockNumber: nft.blockNumber
    };
  };
  
  const checkIfTicketUsed = async (ticketId) => {
    // Check local cache
    const usedTickets = await AsyncStorage.getItem('used_tickets');
    const used = usedTickets ? JSON.parse(usedTickets) : [];
    return used.find(t => t.ticketId === ticketId);
  };
  
  // Render verification result
  if (result) {
    return (
      <View style={styles.resultContainer}>
        <Text style={[
          styles.resultTitle,
          { color: result.valid ? '#10b981' : '#ef4444' }
        ]}>
          {result.valid ? '✅ VALID TICKET' : '❌ INVALID TICKET'}
        </Text>
        
        <Text style={styles.verifiedOn}>
          Verified on: Polygon Blockchain
        </Text>
        
        {result.valid ? (
          <View>
            <Text>Ticket ID: {result.tokenId}</Text>
            <Text>Owner: {result.owner}</Text>
            <Text>Route: {result.metadata.attributes.find(a => a.trait_type === 'Route')?.value}</Text>
            <Text>Seat: {result.metadata.attributes.find(a => a.trait_type === 'Seat')?.value}</Text>
            
            <TouchableOpacity 
              style={styles.markUsedButton}
              onPress={() => markTicketAsUsed(result)}
            >
              <Text>MARK AS USED</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.errorText}>{result.reason}</Text>
            {result.currentOwner && (
              <Text>Current Owner: {result.currentOwner}</Text>
            )}
          </View>
        )}
        
        <TouchableOpacity onPress={() => {
          setResult(null);
          setScanning(true);
        }}>
          <Text>SCAN ANOTHER</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Render scanner
  return (
    <View style={styles.container}>
      {verifying ? (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.verifyingText}>
            Verifying on Polygon Blockchain...
          </Text>
          <Text style={styles.sourceOfTruth}>
            (Source of Truth)
          </Text>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}
    </View>
  );
};

export default ScanTicketScreen;
```

---

## 📊 Comparison: Sui vs Polygon

| Feature | Sui | Polygon |
|---------|-----|---------|
| **Purpose** | Event trigger | Source of truth |
| **Use Case** | Dashboard updates | Ticket verification |
| **Speed** | Very fast | Fast (via Alchemy) |
| **Ownership** | Event only | NFT ownership |
| **Transfers** | Not tracked | Fully tracked |
| **Gate Scanning** | ❌ Don't use | ✅ Always use |
| **Live Feed** | ✅ Use | ❌ Not needed |
| **Finality** | Event finality | Ownership finality |

---

## ✅ Best Practices

### DO ✅

1. **Always verify on Polygon for gate scanning**
   ```javascript
   const valid = await verifyTicketOnPolygon(ticketId, passengerAddress);
   ```

2. **Use Alchemy's optimized APIs**
   ```javascript
   const nfts = await alchemy.nft.getNftsForOwner(address);
   ```

3. **Check ownership, not just existence**
   ```javascript
   const owners = await alchemy.nft.getOwnersForNft(contract, tokenId);
   ```

4. **Cache for offline mode**
   ```javascript
   await AsyncStorage.setItem('cached_tickets', JSON.stringify(cache));
   ```

5. **Use Sui for real-time dashboard updates**
   ```javascript
   suiClient.subscribeEvent({ filter: { MoveEventType: 'TicketMinted' } });
   ```

### DON'T ❌

1. **Don't verify tickets on Sui**
   ```javascript
   // ❌ WRONG
   const ticket = await suiClient.getObject(ticketId);
   ```

2. **Don't trust Sui events for ownership**
   ```javascript
   // ❌ WRONG
   const event = await suiClient.queryEvents({ type: 'TicketMinted' });
   ```

3. **Don't skip ownership verification**
   ```javascript
   // ❌ WRONG
   const nft = await alchemy.nft.getNftMetadata(contract, tokenId);
   // Missing: Check if passenger owns it!
   ```

4. **Don't use Polygon for real-time dashboard**
   ```javascript
   // ❌ WRONG (too slow)
   setInterval(() => checkPolygonForNewTickets(), 1000);
   ```

---

## 🎯 Summary

### Key Takeaways

1. **Polygon = Source of Truth**
   - NFT ownership is the legal ticket
   - Always verify on Polygon for gate scanning
   - Use Alchemy's optimized APIs

2. **Sui = Event Trigger**
   - Fast notifications for dashboard
   - Real-time updates
   - Not for verification

3. **Alchemy's Performance**
   - Optimized for NFT queries
   - Faster than manual crawling
   - Enterprise-grade reliability

4. **Why This Matters**
   - Prevents fraud (transferred tickets)
   - Ensures accuracy (current ownership)
   - Legal compliance (proof of purchase)

---

**🔑 Remember: The NFT on Polygon is the actual legal "ticket". Always verify against Polygon, not Sui.**
