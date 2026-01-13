// Vercel Serverless Function - Wallet Creation
// Creates deterministic SUI wallet from phone number

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import crypto from 'crypto';

const SUI_NETWORK = process.env.SUI_NETWORK || 'testnet';
const MASTER_SECRET = process.env.SUI_MASTER_SECRET || 'africa-railways-test-secret';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const phoneNumber = req.method === 'GET' 
            ? req.query.phone 
            : req.body.phoneNumber;

        if (!phoneNumber) {
            return res.status(400).json({ 
                error: 'Phone number required',
                usage: 'GET /api/wallet/create?phone=+260966165444'
            });
        }

        // Normalize phone number
        const normalizedPhone = phoneNumber.replace(/\D/g, '').slice(-10);
        
        // Generate deterministic keypair
        const hash = crypto.createHash('sha256')
            .update(normalizedPhone + MASTER_SECRET)
            .digest();
        
        const keypair = Ed25519Keypair.fromSecretKey(hash);
        const address = keypair.getPublicKey().toSuiAddress();

        // Check balance on SUI network
        let balance = '0';
        let balanceAfc = '0';
        
        try {
            const client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
            const balanceResult = await client.getBalance({ owner: address });
            balance = balanceResult.totalBalance;
        } catch (e) {
            console.log('Could not fetch balance:', e.message);
        }

        return res.status(200).json({
            success: true,
            wallet: {
                address,
                publicKey: keypair.getPublicKey().toBase64(),
                network: SUI_NETWORK,
                explorerUrl: `https://suiscan.xyz/${SUI_NETWORK}/account/${address}`
            },
            balance: {
                sui: balance,
                afc: balanceAfc
            },
            phone: {
                original: phoneNumber,
                normalized: normalizedPhone
            },
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Wallet creation error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
