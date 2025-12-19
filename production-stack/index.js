const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    // --- DETERMINISTIC WALLET GENERATION ---
    // We create a 32-byte seed based on the phone number
    // In production, add a secret salt: crypto.createHash('sha256').update(phoneNumber + process.env.SUI_MASTER_SECRET)
    const hash = crypto.createHash('sha256').update(phoneNumber).digest();
    const keypair = Ed25519Keypair.fromSecretKey(hash);
    const address = keypair.getPublicKey().toSuiAddress();
    // ----------------------------------------

    let response = "";

    if (text === "") {
        response = `CON Africa Railways ID\n`;
        response += `Wallet: ${address.substring(0,10)}...${address.substring( address.length - 4)}\n`;
        response += `1. Full Address\n`;
        response += `2. Check Assets\n`;
        response += `3. Exit`;
    } else if (text === "1") {
        response = `END Your Full Sui Address:\n${address}`;
    } else if (text === "2") {
        response = "END You have 0.00 SUI\n(Rail-Tokens coming soon!)";
    } else {
        response = "END safe travels!";
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Deterministic Bridge Live on Port ${PORT}`);
});
