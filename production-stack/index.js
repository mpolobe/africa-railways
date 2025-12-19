const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
    // Africa's Talking standard parameters
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    let response = "";

    if (text === "") {
        // This is the first menu
        const keypair = new Ed25519Keypair();
        const address = keypair.getPublicKey().toSuiAddress();
        
        response = `CON Welcome to Africa Railways\n`;
        response += `Your New Sui Wallet:\n${address}\n`;
        response += `1. View Balance\n`;
        response += `2. Exit`;
    } else if (text === "1") {
        response = "END Your balance is 0 SUI. Safe travels!";
    } else {
        response = "END Thank you for using Africa Railways.";
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AT Bridge Live on Port ${PORT}`);
});
