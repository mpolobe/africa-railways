const express = require('express');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const crypto = require('crypto');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const getW = (p) => {
    const s = process.env.SUI_MASTER_SECRET || "salt";
    const h = crypto.createHash('sha256').update(p + s).digest();
    return Ed25519Keypair.fromSecretKey(h).getPublicKey().toSuiAddress();
};

app.post('/ussd', (req, res) => {
    const { phoneNumber: p, text: t } = req.body;
    const resText = t === "" ? "CON Africa Railways\n1. Wallet" : "END Wallet: " + getW(p);
    res.set('Content-Type', 'text/plain').send(resText);
});

app.get('/api/wallet', (req, res) => {
    const p = req.query.phone;
    res.json({ address: getW(p), phoneNumber: p });
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
