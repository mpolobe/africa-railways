/**
 * Telegram Marketing Tool for Africa Railways
 * Uses MTProto API for full Telegram capabilities
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Your Telegram API credentials
const API_ID = 32685049;
const API_HASH = 'ecad5118160ed8989eba07da66faf0c1';

// Session storage
const SESSION_FILE = './session.txt';
let client = null;
let stringSession = new StringSession(
    fs.existsSync(SESSION_FILE) ? fs.readFileSync(SESSION_FILE, 'utf8') : ''
);

// Initialize client
async function initClient() {
    client = new TelegramClient(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
    });
    
    await client.start({
        phoneNumber: async () => await input.text('Enter your phone number: '),
        password: async () => await input.text('Enter your 2FA password (if any): '),
        phoneCode: async () => await input.text('Enter the code you received: '),
        onError: (err) => console.log(err),
    });
    
    // Save session for future use
    fs.writeFileSync(SESSION_FILE, client.session.save());
    console.log('✅ Logged in successfully!');
    return client;
}

// API Routes

// Check login status
app.get('/api/status', async (req, res) => {
    try {
        if (!client || !client.connected) {
            return res.json({ loggedIn: false });
        }
        const me = await client.getMe();
        res.json({ 
            loggedIn: true, 
            user: {
                id: me.id.toString(),
                firstName: me.firstName,
                lastName: me.lastName,
                username: me.username,
                phone: me.phone
            }
        });
    } catch (e) {
        res.json({ loggedIn: false, error: e.message });
    }
});

// Get list of groups/channels user is in
app.get('/api/groups', async (req, res) => {
    try {
        const dialogs = await client.getDialogs();
        const groups = dialogs
            .filter(d => d.isGroup || d.isChannel)
            .map(d => ({
                id: d.id.toString(),
                title: d.title,
                isChannel: d.isChannel,
                isGroup: d.isGroup,
                participantsCount: d.entity?.participantsCount || 0
            }));
        res.json({ groups });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Send message to a specific chat
app.post('/api/send', async (req, res) => {
    const { chatId, message, parseMode } = req.body;
    try {
        const result = await client.sendMessage(chatId, { 
            message,
            parseMode: parseMode || 'html'
        });
        res.json({ success: true, messageId: result.id });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Send to multiple chats (bulk)
app.post('/api/send-bulk', async (req, res) => {
    const { chatIds, message, delayMs = 3000 } = req.body;
    const results = [];
    
    for (const chatId of chatIds) {
        try {
            await client.sendMessage(chatId, { message, parseMode: 'html' });
            results.push({ chatId, success: true });
        } catch (e) {
            results.push({ chatId, success: false, error: e.message });
        }
        // Delay between messages to avoid rate limits
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    res.json({ results });
});

// Join a group/channel by username or invite link
app.post('/api/join', async (req, res) => {
    const { link } = req.body;
    try {
        const result = await client.invoke({
            _: link.includes('joinchat') ? 'messages.importChatInvite' : 'channels.joinChannel',
            hash: link.split('/').pop(),
            channel: link
        });
        res.json({ success: true, result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Search for public groups
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    try {
        const result = await client.invoke({
            _: 'contacts.search',
            q: query,
            limit: 50
        });
        res.json({ results: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Forward message to multiple chats
app.post('/api/forward', async (req, res) => {
    const { fromChatId, messageId, toChatIds, delayMs = 3000 } = req.body;
    const results = [];
    
    for (const toChatId of toChatIds) {
        try {
            await client.forwardMessages(toChatId, {
                messages: [messageId],
                fromPeer: fromChatId
            });
            results.push({ toChatId, success: true });
        } catch (e) {
            results.push({ toChatId, success: false, error: e.message });
        }
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    res.json({ results });
});

// Start server
const PORT = process.env.PORT || 3001;

async function main() {
    console.log('🚀 Africa Railways Telegram Marketing Tool');
    console.log('==========================================\n');
    
    await initClient();
    
    app.listen(PORT, () => {
        console.log(`\n✅ API server running on http://localhost:${PORT}`);
        console.log('\nEndpoints:');
        console.log('  GET  /api/status     - Check login status');
        console.log('  GET  /api/groups     - List your groups/channels');
        console.log('  POST /api/send       - Send message to one chat');
        console.log('  POST /api/send-bulk  - Send to multiple chats');
        console.log('  POST /api/join       - Join a group/channel');
        console.log('  POST /api/forward    - Forward message to chats');
    });
}

main().catch(console.error);
