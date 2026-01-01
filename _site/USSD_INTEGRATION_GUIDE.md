# ARAIL USSD Integration Guide - *384*26621#

## Overview

The USSD gateway is the primary interface for passengers to book train tickets without a smartphone. By dialing **\*384\*26621#**, users access the full ARAIL booking system on any mobile phone.

## Service Configuration

### Africa's Talking Setup

```json
{
  "serviceCode": "*384*26621#",
  "callbackUrl": "https://africa-railways-production.up.railway.app/ussd",
  "provider": "Africa's Talking",
  "countries": ["Zambia", "Tanzania"],
  "networks": ["MTN", "Airtel", "Zamtel", "Vodacom", "Tigo"]
}
```

### Registration Details

**Zambia:**
- Service Code: `*384*26621#`
- Operator: MTN Zambia, Airtel Zambia, Zamtel
- Status: Pending approval
- Application: Submitted to ZICTA (Zambia ICT Authority)

**Tanzania:**
- Service Code: `*384*26621#`
- Operator: Vodacom, Tigo, Airtel Tanzania
- Status: Pending approval
- Application: Submitted to TCRA (Tanzania Communications Regulatory Authority)

---

## Technical Architecture

### Request Flow

```
User dials *384*26621#
    ↓
Africa's Talking Gateway
    ↓
POST https://africa-railways-production.up.railway.app/ussd
    ↓
ARAIL Backend (Railway.app)
    ↓
Process request → Query database → Call Sui blockchain
    ↓
Return USSD response (CON or END)
    ↓
Africa's Talking Gateway
    ↓
Display to user
```

### Request Format

Africa's Talking sends POST requests with these parameters:

```javascript
{
  "sessionId": "ATUid_abc123xyz",
  "serviceCode": "*384*26621#",
  "phoneNumber": "+260977123456",
  "text": "1*2*3",  // User's menu selections
  "networkCode": "63902"  // MTN Zambia
}
```

### Response Format

Your server must respond with USSD markup:

```javascript
// Continue session (show menu)
"CON Welcome to ARAIL\n1. Book Ticket\n2. View Routes\n3. My Bookings"

// End session (final message)
"END Your ticket has been sent to +260977123456. Safe travels!"
```

---

## Backend Implementation

### Express.js Route Handler

```javascript
// server/routes/ussd.js
import express from 'express';
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

const router = express.Router();

// Sui configuration
const suiClient = new SuiClient({ url: process.env.SUI_RPC_URL });
const keypair = Ed25519Keypair.fromSecretKey(
    Buffer.from(process.env.SUI_PRIVATE_KEY, 'base64')
);

// IP whitelist for Africa's Talking
const ALLOWED_IPS = [
    '52.48.80.0/24',      // Africa's Talking EU
    '54.76.0.0/16',       // Africa's Talking EU
    '3.8.0.0/16',         // Africa's Talking EU
    '18.202.0.0/16',      // Africa's Talking EU
];

// Security middleware
function validateAfricasTalking(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check if IP is in whitelist
    const isAllowed = ALLOWED_IPS.some(range => {
        // Simple IP range check (use proper library in production)
        return clientIP.startsWith(range.split('/')[0].slice(0, -2));
    });
    
    if (!isAllowed && process.env.NODE_ENV === 'production') {
        console.error(`Unauthorized USSD request from ${clientIP}`);
        return res.status(403).send('Forbidden');
    }
    
    next();
}

// Main USSD handler
router.post('/ussd', validateAfricasTalking, async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text, networkCode } = req.body;
    
    console.log(`[USSD] Session: ${sessionId}, Phone: ${phoneNumber}, Text: ${text}`);
    
    try {
        let response = '';
        
        // Parse user input
        const textArray = text.split('*');
        const level = textArray.length;
        
        // Main menu
        if (text === '') {
            response = `CON Welcome to ARAIL 🚂
1. Book Ticket
2. View Routes
3. My Bookings
4. Check Balance
5. Help`;
        }
        
        // Book Ticket flow
        else if (text === '1') {
            response = `CON Select Route:
1. Lusaka → Dar es Salaam
2. Dar es Salaam → Lusaka
3. Lusaka → Kapiri Mposhi
4. Kapiri Mposhi → Lusaka
0. Back`;
        }
        
        else if (text.startsWith('1*')) {
            const route = textArray[1];
            
            if (route === '1') {
                response = await handleRouteSelection(
                    sessionId, 
                    phoneNumber, 
                    'Lusaka', 
                    'Dar es Salaam'
                );
            } else if (route === '2') {
                response = await handleRouteSelection(
                    sessionId, 
                    phoneNumber, 
                    'Dar es Salaam', 
                    'Lusaka'
                );
            } else if (route === '3') {
                response = await handleRouteSelection(
                    sessionId, 
                    phoneNumber, 
                    'Lusaka', 
                    'Kapiri Mposhi'
                );
            } else if (route === '4') {
                response = await handleRouteSelection(
                    sessionId, 
                    phoneNumber, 
                    'Kapiri Mposhi', 
                    'Lusaka'
                );
            } else if (route === '0') {
                response = `CON Welcome to ARAIL 🚂
1. Book Ticket
2. View Routes
3. My Bookings
4. Check Balance
5. Help`;
            }
        }
        
        // View Routes
        else if (text === '2') {
            response = `CON Available Routes:
1. Lusaka ↔ Dar es Salaam (1,860 km)
2. Lusaka ↔ Kapiri Mposhi (200 km)
3. Kapiri ↔ Dar es Salaam (1,660 km)
0. Back`;
        }
        
        // My Bookings
        else if (text === '3') {
            response = await getMyBookings(phoneNumber);
        }
        
        // Check Balance
        else if (text === '4') {
            response = await checkAFCBalance(phoneNumber);
        }
        
        // Help
        else if (text === '5') {
            response = `END ARAIL Help:
- Dial *384*26621# to book tickets
- Pay with mobile money (MTN, Airtel)
- Tickets sent via SMS
- Support: +260977000000`;
        }
        
        // Invalid input
        else {
            response = `END Invalid selection. Please dial *384*26621# to try again.`;
        }
        
        res.set('Content-Type', 'text/plain');
        res.send(response);
        
    } catch (error) {
        console.error('[USSD] Error:', error);
        res.send('END An error occurred. Please try again later.');
    }
});

// Handle route selection and seat booking
async function handleRouteSelection(sessionId, phoneNumber, origin, destination) {
    // Get available trains for this route
    const trains = await getAvailableTrains(origin, destination);
    
    if (trains.length === 0) {
        return `END No trains available for ${origin} → ${destination} today. Please try again tomorrow.`;
    }
    
    // Store session data
    await storeSessionData(sessionId, {
        phoneNumber,
        origin,
        destination,
        trains
    });
    
    let response = `CON ${origin} → ${destination}\nSelect Train:\n`;
    trains.forEach((train, index) => {
        response += `${index + 1}. ${train.departure} - ${train.class} (K${train.price})\n`;
    });
    response += '0. Back';
    
    return response;
}

// Get user's bookings
async function getMyBookings(phoneNumber) {
    const bookings = await database.getBookings(phoneNumber);
    
    if (bookings.length === 0) {
        return `END You have no bookings yet. Dial *384*26621# to book a ticket.`;
    }
    
    let response = `END Your Bookings:\n`;
    bookings.forEach((booking, index) => {
        response += `${index + 1}. ${booking.route} - ${booking.date}\n`;
    });
    
    return response;
}

// Check AFC balance
async function checkAFCBalance(phoneNumber) {
    try {
        // Get user's Sui wallet address from phone number
        const userAddress = await getUserWalletAddress(phoneNumber);
        
        // Query AFC balance on Sui
        const balance = await suiClient.getBalance({
            owner: userAddress,
            coinType: `${process.env.AFC_PACKAGE_ID}::africoin::AFC`
        });
        
        const afcBalance = parseInt(balance.totalBalance) / 1_000_000_000; // Convert from MIST
        
        return `END Your AFC Balance: ${afcBalance.toFixed(2)} AFC
(Equivalent to K${afcBalance.toFixed(2)} ZMW)`;
    } catch (error) {
        console.error('[AFC Balance] Error:', error);
        return `END Unable to check balance. Please try again.`;
    }
}

// Mint ticket NFT on Sui blockchain
async function mintTicketNFT(phoneNumber, bookingDetails) {
    try {
        const { origin, destination, date, seatNumber, price } = bookingDetails;
        
        // Get user's wallet address
        const userAddress = await getUserWalletAddress(phoneNumber);
        
        // Create transaction to mint ticket NFT
        const tx = new TransactionBlock();
        
        tx.moveCall({
            target: `${process.env.TICKET_PACKAGE_ID}::ticket_nft::mint_ticket`,
            arguments: [
                tx.pure(userAddress),
                tx.pure(origin),
                tx.pure(destination),
                tx.pure(date),
                tx.pure(seatNumber),
                tx.pure(price * 1_000_000_000), // Convert to MIST
            ],
        });
        
        // Sign and execute transaction
        const result = await suiClient.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            signer: keypair,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        
        console.log('[Ticket NFT] Minted:', result.digest);
        
        // Extract ticket NFT ID
        const ticketNFT = result.objectChanges.find(
            change => change.type === 'created' && change.objectType.includes('TicketNFT')
        );
        
        return {
            success: true,
            txDigest: result.digest,
            ticketId: ticketNFT?.objectId,
        };
        
    } catch (error) {
        console.error('[Ticket NFT] Error:', error);
        return { success: false, error: error.message };
    }
}

export default router;
```

### Database Schema

```sql
-- Session storage for multi-step USSD flows
CREATE TABLE ussd_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 minutes'
);

-- User wallet mapping
CREATE TABLE user_wallets (
    phone_number VARCHAR(20) PRIMARY KEY,
    sui_address VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    seat_number VARCHAR(10),
    price DECIMAL(10, 2) NOT NULL,
    ticket_nft_id VARCHAR(66),
    tx_digest VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- AFC transactions
CREATE TABLE afc_transactions (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'mint', 'burn', 'transfer'
    amount DECIMAL(18, 9) NOT NULL,
    tx_digest VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Mobile Money Integration

### Payment Flow

```
User confirms booking
    ↓
System initiates mobile money payment
    ↓
User receives STK push / USSD prompt
    ↓
User enters PIN
    ↓
Payment confirmed
    ↓
System mints AFC
    ↓
System mints ticket NFT
    ↓
User receives SMS with ticket details
```

### MTN Mobile Money (Zambia)

```javascript
import axios from 'axios';

async function initiateMTNPayment(phoneNumber, amount, reference) {
    const response = await axios.post(
        'https://api.mtn.com/collection/v1_0/requesttopay',
        {
            amount: amount.toString(),
            currency: 'ZMW',
            externalId: reference,
            payer: {
                partyIdType: 'MSISDN',
                partyId: phoneNumber.replace('+260', '260')
            },
            payerMessage: 'ARAIL Train Ticket',
            payeeNote: `Ticket: ${reference}`
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.MTN_API_KEY}`,
                'X-Reference-Id': reference,
                'X-Target-Environment': 'production',
                'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY
            }
        }
    );
    
    return response.data;
}
```

### Airtel Money (Zambia)

```javascript
async function initiateAirtelPayment(phoneNumber, amount, reference) {
    const response = await axios.post(
        'https://openapiuat.airtel.africa/merchant/v1/payments/',
        {
            reference,
            subscriber: {
                country: 'ZM',
                currency: 'ZMW',
                msisdn: phoneNumber.replace('+260', '260')
            },
            transaction: {
                amount: amount.toString(),
                country: 'ZM',
                currency: 'ZMW',
                id: reference
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.AIRTEL_API_KEY}`,
                'Content-Type': 'application/json',
                'X-Country': 'ZM',
                'X-Currency': 'ZMW'
            }
        }
    );
    
    return response.data;
}
```

---

## Security Implementation

### IP Whitelisting

```javascript
// middleware/ipWhitelist.js
const AFRICAS_TALKING_IPS = [
    '52.48.80.0/24',
    '54.76.0.0/16',
    '3.8.0.0/16',
    '18.202.0.0/16',
];

function isIPAllowed(ip) {
    // Use ip-range-check library in production
    return AFRICAS_TALKING_IPS.some(range => {
        const [network, bits] = range.split('/');
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        const networkInt = ipToInt(network);
        const ipInt = ipToInt(ip);
        return (ipInt & mask) === (networkInt & mask);
    });
}

function ipToInt(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct), 0) >>> 0;
}

export function validateIP(req, res, next) {
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    if (!isIPAllowed(clientIP) && process.env.NODE_ENV === 'production') {
        console.error(`[Security] Blocked request from ${clientIP}`);
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
}
```

### Request Signing (Optional)

```javascript
import crypto from 'crypto';

function verifyAfricasTalkingSignature(req) {
    const signature = req.headers['x-africas-talking-signature'];
    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', process.env.AFRICAS_TALKING_API_KEY)
        .update(payload)
        .digest('hex');
    
    return signature === expectedSignature;
}
```

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const ussdLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per IP
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/ussd', ussdLimiter, validateIP, handleUSSD);
```

---

## Railway.app Deployment

### Environment Variables

```bash
# Sui Blockchain
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
SUI_PRIVATE_KEY=base64_encoded_private_key
TICKET_PACKAGE_ID=0xYOUR_TICKET_PACKAGE_ID
AFC_PACKAGE_ID=0xYOUR_AFC_PACKAGE_ID
TREASURY_ID=0xYOUR_TREASURY_ID

# Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username

# Mobile Money
MTN_API_KEY=your_mtn_api_key
MTN_SUBSCRIPTION_KEY=your_mtn_subscription_key
AIRTEL_API_KEY=your_airtel_api_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/arail

# App
NODE_ENV=production
PORT=3000
```

### Deployment Script

```bash
#!/bin/bash
# deploy-ussd.sh

echo "🚂 Deploying ARAIL USSD Gateway to Railway.app"

# Build
echo "📦 Building application..."
npm run build

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Set environment variables
echo "🔐 Setting environment variables..."
railway variables set SUI_RPC_URL=$SUI_RPC_URL
railway variables set SUI_PRIVATE_KEY=$SUI_PRIVATE_KEY
railway variables set AFRICAS_TALKING_API_KEY=$AFRICAS_TALKING_API_KEY

# Verify deployment
echo "✅ Verifying deployment..."
curl -X POST https://africa-railways-production.up.railway.app/health

echo "✅ Deployment complete!"
echo "📱 USSD Code: *384*26621#"
echo "🔗 Callback URL: https://africa-railways-production.up.railway.app/ussd"
```

### Monitoring & Logs

```javascript
// middleware/logging.js
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

export function logUSSDRequest(req, res, next) {
    logger.info('USSD Request', {
        sessionId: req.body.sessionId,
        phoneNumber: req.body.phoneNumber,
        text: req.body.text,
        timestamp: new Date().toISOString(),
    });
    next();
}

export function logUSSDError(error, req, res, next) {
    logger.error('USSD Error', {
        error: error.message,
        stack: error.stack,
        sessionId: req.body.sessionId,
        phoneNumber: req.body.phoneNumber,
        timestamp: new Date().toISOString(),
    });
    res.send('END An error occurred. Please try again.');
}
```

---

## Testing

### Local Testing

```bash
# Start local server
npm run dev

# Simulate USSD request
curl -X POST http://localhost:3000/ussd \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=test123&serviceCode=*384*26621#&phoneNumber=%2B260977123456&text="
```

### Africa's Talking Simulator

```javascript
// test/ussd-simulator.js
import axios from 'axios';

async function simulateUSSDSession() {
    const sessionId = 'test_' + Date.now();
    const phoneNumber = '+260977123456';
    
    // Step 1: Initial menu
    let response = await sendUSSD(sessionId, phoneNumber, '');
    console.log('Step 1:', response);
    
    // Step 2: Select "Book Ticket"
    response = await sendUSSD(sessionId, phoneNumber, '1');
    console.log('Step 2:', response);
    
    // Step 3: Select route
    response = await sendUSSD(sessionId, phoneNumber, '1*1');
    console.log('Step 3:', response);
    
    // Continue...
}

async function sendUSSD(sessionId, phoneNumber, text) {
    const response = await axios.post('http://localhost:3000/ussd', {
        sessionId,
        serviceCode: '*384*26621#',
        phoneNumber,
        text,
        networkCode: '63902'
    });
    return response.data;
}

simulateUSSDSession();
```

---

## Production Checklist

### Pre-Launch

- [ ] Service code registered with ZICTA (Zambia)
- [ ] Service code registered with TCRA (Tanzania)
- [ ] Africa's Talking account verified
- [ ] Callback URL configured
- [ ] IP whitelist implemented
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Database schema deployed
- [ ] Sui smart contracts deployed to mainnet
- [ ] Mobile money integrations tested
- [ ] SMS notifications configured

### Launch Day

- [ ] Monitor Railway.app logs
- [ ] Test USSD flow end-to-end
- [ ] Verify ticket NFT minting
- [ ] Check AFC balance updates
- [ ] Monitor mobile money payments
- [ ] Track session timeouts
- [ ] Respond to user support requests

### Post-Launch

- [ ] Analyze usage metrics
- [ ] Optimize response times
- [ ] Fix any bugs
- [ ] Add new routes
- [ ] Improve UX based on feedback
- [ ] Scale infrastructure as needed

---

## Troubleshooting

### Common Issues

**Issue: Session timeout**
```
Solution: Reduce menu depth, cache session data, increase timeout
```

**Issue: Mobile money payment fails**
```
Solution: Check API credentials, verify user has sufficient balance, retry logic
```

**Issue: Ticket NFT not minted**
```
Solution: Check Sui RPC connection, verify gas balance, check smart contract
```

**Issue: USSD not responding**
```
Solution: Check Railway.app logs, verify callback URL, test IP whitelist
```

---

## Support

**Technical Issues:**
- Email: tech@africarailways.com
- Phone: +260 977 000 000

**Africa's Talking Support:**
- Email: support@africastalking.com
- Docs: https://developers.africastalking.com

**Railway.app Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

---

**Last Updated:** December 31, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
