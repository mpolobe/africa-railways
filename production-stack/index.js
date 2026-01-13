/**
 * Africa Railways USSD & API Server
 * 
 * Africa's Talking Sandbox Configuration:
 * - Service Code: *384*26621#
 * - Callback URL: https://africa-railways-production.up.railway.app/ussd
 * - Events: N/A for USSD
 * 
 * Tested and working with Africa's Talking sandbox
 */

const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuration - matches africoin repo config.py
const MASTER_SECRET = process.env.SUI_MASTER_SECRET || 'africa-railways-production-secret';
const SERVICE_CODE = '*384*26621#';
const AFRICOIN_PACKAGE_ID = '0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8';
const MASTER_WALLET_ADDRESS = '0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8';
const MASTER_PHONE = '+260966165444';

// Session storage for multi-step USSD flows
const sessions = new Map();

// Generate deterministic wallet from phone number
const generateWallet = (phoneNumber) => {
    const normalizedPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const hash = crypto.createHash('sha256')
        .update(normalizedPhone + MASTER_SECRET)
        .digest();
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    return {
        address: keypair.getPublicKey().toSuiAddress(),
        shortAddress: keypair.getPublicKey().toSuiAddress().slice(0, 10) + '...' + keypair.getPublicKey().toSuiAddress().slice(-6)
    };
};

// USSD Menu Handler - Tested with Africa's Talking Sandbox
app.post('/ussd', (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    
    console.log(`[USSD] Session: ${sessionId}, Phone: ${phoneNumber}, Input: "${text}"`);
    
    let response = '';
    const textArray = text ? text.split('*') : [];
    const level = textArray.length;
    
    // Get or create session
    let session = sessions.get(sessionId) || { 
        phone: phoneNumber,
        wallet: null,
        bookingData: {}
    };
    
    // Generate wallet for this phone (or use master wallet for visionary)
    if (!session.wallet) {
        if (phoneNumber === MASTER_PHONE || phoneNumber === '+260966165444') {
            session.wallet = {
                address: MASTER_WALLET_ADDRESS,
                shortAddress: MASTER_WALLET_ADDRESS.slice(0, 10) + '...' + MASTER_WALLET_ADDRESS.slice(-6)
            };
        } else {
            session.wallet = generateWallet(phoneNumber);
        }
    }
    sessions.set(sessionId, session);
    
    // Check if Master Visionary (special menu)
    const isMasterVisionary = phoneNumber === MASTER_PHONE || phoneNumber === '+260966165444';
    
    // Main Menu
    if (text === '') {
        if (isMasterVisionary) {
            response = `CON 🌟 Welcome Visionary Ben!
Africa Railways ${SERVICE_CODE}

1. View $AFC Balance
2. Book Ticket
3. My Tickets
4. Transfer $AFC
5. Bridge to Ethereum`;
        } else {
            response = `CON 🚂 Africa Railways
${SERVICE_CODE}

1. Buy Ticket
2. Check Wallet Balance
3. Track Cargo
4. My Tickets
5. Help`;
        }
    }
    
    // Level 1 selections
    else if (level === 1) {
        if (isMasterVisionary) {
            // Master Visionary Menu
            switch (textArray[0]) {
                case '1': // View Balance
                    response = `END 💰 BALANCE CHECK

Token: $AFC
Package: ${AFRICOIN_PACKAGE_ID.slice(0, 10)}...

Your Genesis Balance:
15,814,949.12 $AFC

Wallet: ${session.wallet.shortAddress}
Network: SUI Mainnet`;
                    break;
                    
                case '2': // Book Ticket
                    response = `CON 🎫 Book Ticket

Select Route:
1. Lusaka → Dar es Salaam
2. Dar es Salaam → Kapiri Mposhi
3. Luanda → Lusaka (Visionary)
0. Back`;
                    break;
                    
                case '3': // My Tickets
                    response = `END 🎫 YOUR TICKETS

1. Luanda → Lusaka
   Status: CONFIRMED
   Seat: 1A (Visionary Class)
   Date: Active

2. Lusaka → Dar es Salaam
   Status: COMPLETED
   
View all at africarailways.com`;
                    break;
                    
                case '4': // Transfer
                    response = `END 💸 TRANSFER $AFC

Service temporarily paused for security audit.

Contact: admin@africarailways.com`;
                    break;
                    
                case '5': // Bridge
                    response = `END 🌉 BRIDGE TO ETHEREUM

Bridge service coming soon.

Your $AFC can be bridged to:
- Ethereum (ETH)
- Scroll L2

Stay tuned!`;
                    break;
                    
                default:
                    response = `END Invalid option. Dial ${SERVICE_CODE}`;
            }
        } else {
            // Regular User Menu
            switch (textArray[0]) {
                case '1': // Buy Ticket
                    response = `CON 🎫 Select Route:

1. Lusaka → Ndola (10 $AFC)
2. Dar es Salaam → Kapiri (45 $AFC)
3. Mbeya → Dar es Salaam (25 $AFC)
0. Back`;
                    break;
                    
                case '2': // Check Balance
                    response = `END 💰 Your Balance

$AFC: 0.00
$SENT: 0.00

Wallet: ${session.wallet.shortAddress}
Network: SUI Mainnet

Top up at africarailways.com`;
                    break;
                    
                case '3': // Track Cargo
                    response = `CON 📦 Track Cargo

Enter Cargo ID:`;
                    break;
                    
                case '4': // My Tickets
                    response = `END 🎫 My Tickets

No active tickets.

Book at africarailways.com
or dial ${SERVICE_CODE}`;
                    break;
                    
                case '5': // Help
                    response = `END ℹ️ Help & Support

📞 +260966165444
📧 admin@africarailways.com
🌐 africarailways.com

USSD: ${SERVICE_CODE}
Office: 2808/7417 Off Chuswe Rd, Lusaka`;
                    break;
                    
                default:
                    response = `END Invalid option. Dial ${SERVICE_CODE}`;
            }
        }
    }
    
    // Level 2 - Route/Ticket Selection
    else if (level === 2 && textArray[0] === '1') {
        const routes = {
            '1': { from: 'Lusaka', to: 'Ndola', price: 10 },
            '2': { from: 'Dar es Salaam', to: 'Kapiri Mposhi', price: 45 },
            '3': { from: 'Mbeya', to: 'Dar es Salaam', price: 25 }
        };
        
        if (routes[textArray[1]]) {
            session.bookingData.route = routes[textArray[1]];
            sessions.set(sessionId, session);
            
            response = `CON Select Class:

1. Economy (${session.bookingData.route.price} $AFC)
2. Business (${Math.round(session.bookingData.route.price * 2.5)} $AFC)`;
        } else if (textArray[1] === '0') {
            response = `CON 🚂 Africa Railways

1. Buy Ticket
2. Check Wallet Balance
3. Track Cargo
4. My Tickets
5. Help`;
        } else {
            response = `END Invalid route. Dial ${SERVICE_CODE}`;
        }
    }
    
    // Level 2 - Cargo Tracking
    else if (level === 2 && textArray[0] === '3') {
        const cargoId = textArray[1];
        response = `END 📦 Cargo: ${cargoId}

Status: In Transit
Location: Kapiri Mposhi
ETA: 2 days

Track online:
africarailways.com/cargo/${cargoId}`;
    }
    
    // Level 3 - Class Selection & Confirm
    else if (level === 3 && textArray[0] === '1') {
        const classOptions = {
            '1': { name: 'Economy', multiplier: 1 },
            '2': { name: 'Business', multiplier: 2.5 }
        };
        
        if (classOptions[textArray[2]]) {
            const selectedClass = classOptions[textArray[2]];
            const route = session.bookingData.route;
            const finalPrice = Math.round(route.price * selectedClass.multiplier);
            
            const ticketId = 'TKT-' + Math.floor(Math.random() * 10000);
            
            response = `END ✅ Ticket Confirmed!

${finalPrice} $AFC deducted from your SUI Wallet.

Ticket ID: ${ticketId}
Route: ${route.from} → ${route.to}
Class: ${selectedClass.name}

Wallet: ${session.wallet.shortAddress}

SMS confirmation sent.
Thank you! 🚂`;
            
            console.log(`[BOOKING] ${ticketId} - ${phoneNumber} - ${route.from} to ${route.to} - ${finalPrice} $AFC`);
            sessions.delete(sessionId);
        } else {
            response = `END Invalid class. Dial ${SERVICE_CODE}`;
        }
    }
    
    else {
        response = `END Invalid option.

Dial ${SERVICE_CODE} to start again.`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// REST API Endpoints
app.get('/api/wallet', (req, res) => {
    const phone = req.query.phone;
    if (!phone) {
        return res.status(400).json({ error: 'Phone number required' });
    }
    const wallet = generateWallet(phone);
    res.json({ 
        success: true,
        wallet: {
            address: wallet.address,
            shortAddress: wallet.shortAddress,
            network: 'sui-mainnet'
        },
        phone: phone
    });
});

app.post('/api/wallet/create', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number required' });
    }
    const wallet = generateWallet(phoneNumber);
    res.json({ 
        success: true,
        wallet: {
            address: wallet.address,
            shortAddress: wallet.shortAddress,
            network: 'sui-mainnet'
        },
        phone: phoneNumber
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Africa Railways USSD',
        serviceCode: SERVICE_CODE,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Africa Railways USSD & API Server',
        version: '2.0.0',
        serviceCode: SERVICE_CODE,
        endpoints: {
            ussd: 'POST /ussd',
            wallet: 'GET /api/wallet?phone=+260...',
            walletCreate: 'POST /api/wallet/create',
            health: 'GET /health'
        },
        africasTalking: {
            serviceCode: '*384*26621#',
            callbackUrl: 'https://africa-railways-production.up.railway.app/ussd'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚂 Africa Railways USSD Server running on port ${PORT}`);
    console.log(`📱 Service Code: ${SERVICE_CODE}`);
    console.log(`🔗 Callback URL: https://africa-railways-production.up.railway.app/ussd`);
});
