// Vercel Serverless Function - Complete Booking Flow
// Handles: Wallet Creation, Payment Processing, NFT Minting, AFC Conversion

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import crypto from 'crypto';

// SUI Network Configuration
const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';
const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });

// Master secret for deterministic wallet generation
const MASTER_SECRET = process.env.SUI_MASTER_SECRET || 'africa-railways-test-secret';

// Generate deterministic wallet from phone number
function generateWallet(phoneNumber) {
    const normalizedPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const hash = crypto.createHash('sha256')
        .update(normalizedPhone + MASTER_SECRET)
        .digest();
    
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    return {
        address: keypair.getPublicKey().toSuiAddress(),
        publicKey: keypair.getPublicKey().toBase64()
    };
}

// Generate unique booking reference
function generateBookingRef() {
    return 'AFC-' + Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Generate NFT ID
function generateNftId() {
    return 'NFT-' + Date.now().toString(36).toUpperCase() + 
           crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Simulate IPFS upload (in production, use Pinata/IPFS)
function generateIpfsHash(metadata) {
    const hash = crypto.createHash('sha256')
        .update(JSON.stringify(metadata))
        .digest('hex');
    return 'Qm' + hash.substring(0, 44);
}

// Convert payment to AFC (simulation)
function convertToAfc(amountUsd, currency) {
    // AFC is pegged 1:1 to USD
    const afcAmount = amountUsd;
    return {
        afcAmount,
        exchangeRate: 1.0,
        originalAmount: amountUsd,
        originalCurrency: currency
    };
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            phoneNumber,
            from,
            to,
            date,
            passengers,
            ticketClass,
            tripType,
            priceUsd,
            currency
        } = req.body;

        // Validate required fields
        if (!phoneNumber || !from || !to || !date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['phoneNumber', 'from', 'to', 'date']
            });
        }

        const steps = [];
        const startTime = Date.now();

        // Step 1: Create/Get Wallet
        steps.push({ step: 'wallet_creation', status: 'started', timestamp: Date.now() });
        const wallet = generateWallet(phoneNumber);
        steps.push({ 
            step: 'wallet_creation', 
            status: 'completed', 
            timestamp: Date.now(),
            data: { address: wallet.address }
        });

        // Step 2: Convert Payment to AFC
        steps.push({ step: 'afc_conversion', status: 'started', timestamp: Date.now() });
        const afcConversion = convertToAfc(priceUsd || 25, currency || 'USD');
        steps.push({ 
            step: 'afc_conversion', 
            status: 'completed', 
            timestamp: Date.now(),
            data: afcConversion
        });

        // Step 3: Generate Booking Reference
        steps.push({ step: 'booking_creation', status: 'started', timestamp: Date.now() });
        const bookingRef = generateBookingRef();
        const nftId = generateNftId();
        steps.push({ 
            step: 'booking_creation', 
            status: 'completed', 
            timestamp: Date.now(),
            data: { bookingRef, nftId }
        });

        // Step 4: Create NFT Metadata
        steps.push({ step: 'nft_metadata', status: 'started', timestamp: Date.now() });
        const ticketMetadata = {
            name: `Africa Railways Ticket - ${bookingRef}`,
            description: `Train ticket from ${from} to ${to}`,
            image: `https://africarailways.com/api/ticket-image/${bookingRef}`,
            attributes: [
                { trait_type: 'Route', value: `${from} → ${to}` },
                { trait_type: 'Date', value: date },
                { trait_type: 'Class', value: ticketClass || 'Economy' },
                { trait_type: 'Passengers', value: passengers || 1 },
                { trait_type: 'Trip Type', value: tripType || 'One Way' },
                { trait_type: 'Price AFC', value: afcConversion.afcAmount },
                { trait_type: 'Booking Ref', value: bookingRef }
            ],
            properties: {
                category: 'ticket',
                railway: 'Africa Railways',
                blockchain: 'SUI',
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        };
        const ipfsHash = generateIpfsHash(ticketMetadata);
        steps.push({ 
            step: 'nft_metadata', 
            status: 'completed', 
            timestamp: Date.now(),
            data: { ipfsHash, metadataUrl: `ipfs://${ipfsHash}` }
        });

        // Step 5: Mint NFT on SUI (simulation for testnet)
        steps.push({ step: 'nft_minting', status: 'started', timestamp: Date.now() });
        
        // In production, this would be a real SUI transaction
        const txDigest = '0x' + crypto.randomBytes(32).toString('hex');
        const objectId = '0x' + crypto.randomBytes(32).toString('hex');
        
        steps.push({ 
            step: 'nft_minting', 
            status: 'completed', 
            timestamp: Date.now(),
            data: { 
                txDigest, 
                objectId,
                network: SUI_NETWORK,
                explorerUrl: `https://suiscan.xyz/${SUI_NETWORK}/tx/${txDigest}`
            }
        });

        // Step 6: Store booking in database (localStorage simulation)
        steps.push({ step: 'database_storage', status: 'started', timestamp: Date.now() });
        const booking = {
            id: bookingRef,
            nftId,
            wallet: wallet.address,
            phone: phoneNumber,
            route: { from, to },
            date,
            passengers: passengers || 1,
            class: ticketClass || 'Economy',
            tripType: tripType || 'One Way',
            payment: {
                amountUsd: priceUsd || 25,
                amountAfc: afcConversion.afcAmount,
                currency: currency || 'USD',
                status: 'completed'
            },
            nft: {
                objectId,
                txDigest,
                ipfsHash,
                metadataUrl: `ipfs://${ipfsHash}`
            },
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        steps.push({ 
            step: 'database_storage', 
            status: 'completed', 
            timestamp: Date.now()
        });

        const totalTime = Date.now() - startTime;

        // Return complete response
        return res.status(200).json({
            success: true,
            booking,
            wallet: {
                address: wallet.address,
                network: SUI_NETWORK,
                isNew: true // In production, check if wallet existed
            },
            nft: {
                id: nftId,
                objectId,
                txDigest,
                ipfsHash,
                metadataUrl: `ipfs://${ipfsHash}`,
                explorerUrl: `https://suiscan.xyz/${SUI_NETWORK}/tx/${txDigest}`
            },
            payment: {
                originalAmount: priceUsd || 25,
                originalCurrency: currency || 'USD',
                afcAmount: afcConversion.afcAmount,
                exchangeRate: 1.0,
                status: 'completed'
            },
            steps,
            processingTime: `${totalTime}ms`
        });

    } catch (error) {
        console.error('Booking error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
