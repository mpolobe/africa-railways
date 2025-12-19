const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const getWallet = (phoneNumber) => {
    const salt = process.env.SUI_MASTER_SECRET || "default_fallback_salt";
    const hash = crypto.createHash('sha256').update(phoneNumber + salt).digest();
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    return {
        address: keypair.getPublicKey().toSuiAddress(),
    };
};

// 📟 USSD Endpoint
app.post('/ussd', (req, res) => {
    const { phoneNumber, text } = req.body;
    const { address } = getWallet(phoneNumber);
    let response = text === "" ? "CON Africa Railways\n1. Wallet\n2. Exit" : "END Wallet: " + address;
    res.set('Content-Type', 'text/plain').send(response);
});

// 📱 Smartphone API Endpoint
app.get('/api/wallet', (req, res) => {
    const phoneNumber = req.query.phone;
    if (!phoneNumber) return res.status(400).json({ error: "Missing phone number" });
    const { address } = getWallet(phoneNumber);
    res.json({ address, phoneNumber, status: "Secure" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Bridge Live on Port ${PORT}`));
