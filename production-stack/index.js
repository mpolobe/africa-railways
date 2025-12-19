const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
const app = express();

// Support both USSD (URL-encoded) and Smartphone Apps (JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function to generate the deterministic wallet
const getWallet = (phoneNumber) => {
    const salt = process.env.SUI_MASTER_SECRET || "default_fallback_salt";
    const hash = crypto.createHash('sha256').update(phoneNumber + salt).digest();
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    return {
        address: keypair.getPublicKey().toSuiAddress(),
        keypair: keypair
    };
};

// 📟 USSD ENDPOINT (For Feature Phones)
app.post('/ussd', (req, res) => {
    const { phoneNumber, text } = req.body;
    const { address } = getWallet(phoneNumber);

    let response = "";
    if (text === "") {
        response = `CON Africa Railways\n1. My Wallet\n2. Exit`;
    } else if (text === "1") {
        response = `END Your Wallet:\n${address}`;
    } else {
        response = "END Safe travels!";
    }
    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// 📱 SMARTPHONE API ENDPOINT (For the App)
app.get('/api/wallet/:phone', (req, res) => {
    const { address } = getWallet(req.params.phone);
    res.json({
        network: "Sui Mainnet",
        phoneNumber: req.params.phone,
        address: address,
        status: "Active"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Unified Bridge Online on Port ${PORT}`);
});
