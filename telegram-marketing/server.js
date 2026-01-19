/**
 * Telegram User API Server
 * Allows posting to any group and messaging contacts
 */

const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const API_ID = 32685049;
const API_HASH = 'ecad5118160ed8989eba07da66faf0c1';
const SESSION_FILE = './session.txt';

let client = null;
let phoneCodeHash = null;
let phoneNumber = null;

// Load existing session
function loadSession() {
    if (fs.existsSync(SESSION_FILE)) {
        return fs.readFileSync(SESSION_FILE, 'utf8').trim();
    }
    return '';
}

// Save session
function saveSession(session) {
    fs.writeFileSync(SESSION_FILE, session);
}

// Initialize client
async function initClient(sessionStr = '') {
    client = new TelegramClient(
        new StringSession(sessionStr), 
        API_ID, 
        API_HASH, 
        { connectionRetries: 5 }
    );
    await client.connect();
    return client;
}

// API: Check status
app.get('/api/status', async (req, res) => {
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ loggedIn: false });
        }
        
        await initClient(sessionStr);
        const me = await client.getMe();
        
        res.json({ 
            loggedIn: true, 
            user: {
                id: me.id.toString(),
                firstName: me.firstName,
                lastName: me.lastName || '',
                username: me.username || '',
                phone: me.phone
            }
        });
    } catch (e) {
        res.json({ loggedIn: false, error: e.message });
    }
});

// API: Send OTP code
app.post('/api/send-code', async (req, res) => {
    try {
        phoneNumber = req.body.phone || '+18782069446';
        
        await initClient();
        
        const result = await client.sendCode(
            { apiId: API_ID, apiHash: API_HASH },
            phoneNumber
        );
        
        phoneCodeHash = result.phoneCodeHash;
        
        res.json({ 
            success: true, 
            message: 'Code sent to ' + phoneNumber 
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Verify OTP code
app.post('/api/verify-code', async (req, res) => {
    const { code, password } = req.body;
    
    try {
        try {
            await client.invoke(new Api.auth.SignIn({
                phoneNumber: phoneNumber,
                phoneCodeHash: phoneCodeHash,
                phoneCode: code
            }));
        } catch (e) {
            if (e.message.includes('SESSION_PASSWORD_NEEDED')) {
                // 2FA required
                if (!password) {
                    return res.json({ 
                        success: false, 
                        needs2FA: true, 
                        error: '2FA password required' 
                    });
                }
                
                const passwordResult = await client.invoke(new Api.account.GetPassword());
                const result = await client.invoke(new Api.auth.CheckPassword({
                    password: await client.computePasswordSRP(passwordResult, password)
                }));
            } else {
                throw e;
            }
        }
        
        // Save session
        const session = client.session.save();
        saveSession(session);
        
        const me = await client.getMe();
        
        res.json({ 
            success: true, 
            user: {
                firstName: me.firstName,
                username: me.username
            }
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Get all groups/channels
app.get('/api/groups', async (req, res) => {
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ success: false, error: 'Not logged in' });
        }
        
        await initClient(sessionStr);
        
        const dialogs = await client.getDialogs({ limit: 200 });
        const groups = dialogs
            .filter(d => d.isGroup || d.isChannel)
            .map(d => ({
                id: d.id.toString(),
                title: d.title,
                isChannel: d.isChannel,
                isGroup: d.isGroup,
                username: d.entity?.username || null,
                participantsCount: d.entity?.participantsCount || 0
            }));
        
        res.json({ success: true, groups });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Get contacts
app.get('/api/contacts', async (req, res) => {
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ success: false, error: 'Not logged in' });
        }
        
        await initClient(sessionStr);
        
        const result = await client.invoke(new Api.contacts.GetContacts({ hash: 0 }));
        
        const contacts = result.users.map(u => ({
            id: u.id.toString(),
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            username: u.username || '',
            phone: u.phone || ''
        }));
        
        res.json({ success: true, contacts });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Send message to one chat
app.post('/api/send', async (req, res) => {
    const { chatId, message } = req.body;
    
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ success: false, error: 'Not logged in' });
        }
        
        await initClient(sessionStr);
        
        await client.sendMessage(chatId, { message });
        
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Mass send to multiple chats
app.post('/api/mass-send', async (req, res) => {
    const { chatIds, message, delayMs = 5000 } = req.body;
    
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ success: false, error: 'Not logged in' });
        }
        
        await initClient(sessionStr);
        
        const results = [];
        
        for (const chatId of chatIds) {
            try {
                await client.sendMessage(chatId, { message });
                results.push({ chatId, success: true });
                console.log(`✅ Sent to ${chatId}`);
            } catch (e) {
                results.push({ chatId, success: false, error: e.message });
                console.log(`❌ Failed ${chatId}: ${e.message}`);
            }
            
            // Delay to avoid rate limits
            await new Promise(r => setTimeout(r, delayMs));
        }
        
        res.json({ success: true, results });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// API: Send to all contacts
app.post('/api/send-to-contacts', async (req, res) => {
    const { message, delayMs = 5000 } = req.body;
    
    try {
        const sessionStr = loadSession();
        if (!sessionStr) {
            return res.json({ success: false, error: 'Not logged in' });
        }
        
        await initClient(sessionStr);
        
        // Get contacts
        const contactsResult = await client.invoke(new Api.contacts.GetContacts({ hash: 0 }));
        const contacts = contactsResult.users;
        
        const results = [];
        
        for (const contact of contacts) {
            try {
                await client.sendMessage(contact.id, { message });
                results.push({ 
                    id: contact.id.toString(), 
                    name: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                    success: true 
                });
                console.log(`✅ Sent to ${contact.firstName}`);
            } catch (e) {
                results.push({ 
                    id: contact.id.toString(), 
                    name: `${contact.firstName} ${contact.lastName || ''}`.trim(),
                    success: false, 
                    error: e.message 
                });
                console.log(`❌ Failed ${contact.firstName}: ${e.message}`);
            }
            
            // Delay to avoid rate limits
            await new Promise(r => setTimeout(r, delayMs));
        }
        
        res.json({ success: true, results, total: contacts.length });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/marketing.html');
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`
🚀 Telegram Marketing Server
============================
Running on http://localhost:${PORT}

Endpoints:
  GET  /api/status          - Check login status
  POST /api/send-code       - Send OTP to phone
  POST /api/verify-code     - Verify OTP
  GET  /api/groups          - Get all groups
  GET  /api/contacts        - Get all contacts
  POST /api/send            - Send to one chat
  POST /api/mass-send       - Send to multiple chats
  POST /api/send-to-contacts - Send to all contacts
`);
});
