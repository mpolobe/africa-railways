const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    // --- SECURE DETERMINISTIC WALLET ---
    const salt = process.env.SUI_MASTER_SECRET || "default_fallback_salt";
    const hash = crypto.createHash('sha256').update(phoneNumber + salt).digest();
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    const address = keypair.getPublicKey().toSuiAddress();
    // ------------------------------------

    let response = "";
    if (text === "") {
        response = `CON Africa Railways ID\n`;
        response += `Wallet: ${address.substring(0,10)}...${address.substring(address.length - 4)}\n`;
        response += `1. Full Address\n`;
        response += `2. Check Assets\n`;
        response += `3. Exit`;
    } else if (text === "1") {
        response = `END Your Secure Sui Address:\n${address}`;
    } else {
        response = "END Safe travels!";
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Bridge Live on Port ${PORT}`);
});
