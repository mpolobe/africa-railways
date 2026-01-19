/**
 * Africa Railways Telegram Bot
 * Simple bot for posting announcements to channels/groups
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Config file
const CONFIG_FILE = './config.json';

function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return { botToken: '', channels: [] };
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

let bot = null;
let config = loadConfig();

// Initialize bot
function initBot(token) {
    if (bot) bot.stopPolling();
    bot = new TelegramBot(token, { polling: true });
    
    // Log all messages to find chat IDs
    bot.on('message', (msg) => {
        console.log(`📩 Message from: ${msg.chat.title || msg.chat.username || 'Private'}`);
        console.log(`   Chat ID: ${msg.chat.id}`);
        console.log(`   Type: ${msg.chat.type}`);
    });
    
    // Command: /start
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 
            `🚂 *Africa Railways Bot*\n\n` +
            `I can post announcements to your channels.\n\n` +
            `*Commands:*\n` +
            `/chatid - Get this chat's ID\n` +
            `/test - Send a test message\n` +
            `/ido - Post IDO announcement\n\n` +
            `Add me as admin to your channel, then use /chatid there.`,
            { parse_mode: 'Markdown' }
        );
    });
    
    // Command: /chatid
    bot.onText(/\/chatid/, (msg) => {
        bot.sendMessage(msg.chat.id, 
            `📍 *Chat Info*\n\n` +
            `ID: \`${msg.chat.id}\`\n` +
            `Type: ${msg.chat.type}\n` +
            `Title: ${msg.chat.title || 'N/A'}`,
            { parse_mode: 'Markdown' }
        );
    });
    
    // Command: /test
    bot.onText(/\/test/, (msg) => {
        bot.sendMessage(msg.chat.id, '✅ Bot is working!');
    });
    
    // Command: /ido
    bot.onText(/\/ido/, (msg) => {
        const idoMessage = 
`🚀 *SENT IDO IS LIVE ON PINKSALE!*

🛤️ Sentinel ($SENT) - The Investment Engine of Africa Railways

📊 *Token Details:*
• Price: $0.00005 per SENT
• Tokens for Presale: 3,000,000,000 SENT
• SoftCap: 255,000 MATIC
• Network: Polygon

⏰ *Sale Period:* January 19 - January 26, 2026

🔒 730-day liquidity lock for maximum security

👉 [Join the IDO on PinkSale](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)

#SENT #AfricaRailways #IDO #PinkSale #Polygon`;

        bot.sendMessage(msg.chat.id, idoMessage, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: false 
        });
    });
    
    console.log('✅ Bot initialized and listening...');
    return bot;
}

// API Routes

// Set bot token
app.post('/api/config', (req, res) => {
    const { botToken } = req.body;
    if (!botToken) return res.status(400).json({ error: 'Bot token required' });
    
    config.botToken = botToken;
    saveConfig(config);
    
    try {
        initBot(botToken);
        res.json({ success: true, message: 'Bot configured and started' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get config status
app.get('/api/config', (req, res) => {
    res.json({ 
        configured: !!config.botToken,
        channels: config.channels 
    });
});

// Add channel
app.post('/api/channels', (req, res) => {
    const { chatId, name } = req.body;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });
    
    config.channels.push({ chatId, name: name || chatId });
    saveConfig(config);
    res.json({ success: true, channels: config.channels });
});

// Remove channel
app.delete('/api/channels/:chatId', (req, res) => {
    config.channels = config.channels.filter(c => c.chatId !== req.params.chatId);
    saveConfig(config);
    res.json({ success: true, channels: config.channels });
});

// Send message to one channel
app.post('/api/send', async (req, res) => {
    const { chatId, message, parseMode = 'Markdown' } = req.body;
    if (!bot) return res.status(400).json({ error: 'Bot not configured' });
    
    try {
        const result = await bot.sendMessage(chatId, message, { parse_mode: parseMode });
        res.json({ success: true, messageId: result.message_id });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Send to all configured channels
app.post('/api/broadcast', async (req, res) => {
    const { message, parseMode = 'Markdown', delayMs = 2000 } = req.body;
    if (!bot) return res.status(400).json({ error: 'Bot not configured' });
    if (!config.channels.length) return res.status(400).json({ error: 'No channels configured' });
    
    const results = [];
    for (const channel of config.channels) {
        try {
            await bot.sendMessage(channel.chatId, message, { parse_mode: parseMode });
            results.push({ chatId: channel.chatId, name: channel.name, success: true });
        } catch (e) {
            results.push({ chatId: channel.chatId, name: channel.name, success: false, error: e.message });
        }
        await new Promise(r => setTimeout(r, delayMs));
    }
    res.json({ results });
});

// Send photo with caption
app.post('/api/send-photo', async (req, res) => {
    const { chatId, photoUrl, caption, parseMode = 'Markdown' } = req.body;
    if (!bot) return res.status(400).json({ error: 'Bot not configured' });
    
    try {
        const result = await bot.sendPhoto(chatId, photoUrl, { 
            caption, 
            parse_mode: parseMode 
        });
        res.json({ success: true, messageId: result.message_id });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Pre-made announcement templates
app.get('/api/templates', (req, res) => {
    res.json({
        templates: [
            {
                id: 'ido_live',
                name: 'IDO Live Announcement',
                message: `🚀 *SENT IDO IS LIVE ON PINKSALE!*

🛤️ Sentinel ($SENT) - The Investment Engine of Africa Railways

📊 *Token Details:*
• Price: $0.00005 per SENT
• Tokens for Presale: 3,000,000,000 SENT
• SoftCap: 255,000 MATIC
• Network: Polygon

⏰ *Sale Period:* January 19 - January 26, 2026

🔒 730-day liquidity lock

👉 [Join on PinkSale](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)`
            },
            {
                id: 'countdown',
                name: 'Countdown Reminder',
                message: `⏰ *TIME IS RUNNING OUT!*

The SENT IDO ends *January 26, 2026* at 14:00 UTC

Don't miss your chance to invest in Africa's railway future! 🚂

💎 Price: $0.00005 per SENT
🔒 730-day liquidity lock

👉 [Participate Now](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)`
            },
            {
                id: 'why_sent',
                name: 'Why SENT',
                message: `💎 *WHY INVEST IN SENTINEL ($SENT)?*

✅ *Real Infrastructure* - Backing African High Speed Railways
✅ *Utility* - Powers 2,000+ signaling worker nodes
✅ *Security* - 730-day liquidity lock
✅ *Governance* - Network decision-making rights

This isn't just crypto - it's infrastructure investment.

👉 [Invest Now](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)`
            }
        ]
    });
});

const PORT = process.env.PORT || 3001;

// Auto-start bot if configured
if (config.botToken) {
    try {
        initBot(config.botToken);
    } catch (e) {
        console.log('⚠️ Could not start bot:', e.message);
    }
}

app.listen(PORT, () => {
    console.log(`
🚂 Africa Railways Telegram Bot
================================

API running on http://localhost:${PORT}

${config.botToken ? '✅ Bot is active' : '⚠️ Bot not configured - POST /api/config with botToken'}

Endpoints:
  POST /api/config      - Set bot token
  GET  /api/config      - Get config status
  POST /api/channels    - Add a channel
  POST /api/send        - Send to one chat
  POST /api/broadcast   - Send to all channels
  POST /api/send-photo  - Send photo with caption
  GET  /api/templates   - Get message templates
`);
});
