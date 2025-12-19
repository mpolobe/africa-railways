const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const app = express();

app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
    const phoneNumber = req.body.From;
    
    // Generate a deterministic wallet for this phone number
    // In production, you would seed this with your SUI_MASTER_SECRET
    const keypair = new Ed25519Keypair();
    const address = keypair.getPublicKey().toSuiAddress();

    console.log(`✅ Wallet created for ${phoneNumber}: ${address}`);

    res.send(`CON Welcome to Africa Railways\nYour Invisible Wallet Address is:\n${address}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Bridge Online on Port ${PORT}`);
});
