/**
 * Africa Railways Telegram Bot
 * Simple bot for posting announcements to channels/groups
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '5kb' }));
app.use(express.urlencoded({ extended: true, limit: '5kb' }));

// Restricted CORS - only allow localhost for admin panel
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 3600,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Config file location (not in web root)
const CONFIG_DIR = process.env.CONFIG_DIR || '/tmp/telegram-bot';
const CONFIG_FILE = path.join(CONFIG_DIR, '.config.json');

// Ensure config directory exists with restricted permissions
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { mode: 0o700, recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse config file:', e.message);
      return { botToken: '', channels: [] };
    }
  }
  return { botToken: '', channels: [] };
}

function saveConfig(config) {
  ensureConfigDir();
  // Validate config before saving
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config format');
  }
  
  // Never store sensitive data in plain text
  const { botToken, channels } = config;
  if (!botToken || typeof botToken !== 'string' || botToken.length < 10) {
    throw new Error('Invalid bot token');
  }
  
  if (!Array.isArray(channels)) {
    throw new Error('Invalid channels format');
  }
  
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      mode: 0o600 // Read/write for owner only
    });
  } catch (e) {
    console.error('Failed to save config:', e.message);
    throw e;
  }
}

let bot = null;
let config = loadConfig();

// Request validation middleware
function validateChatId(chatId) {
  return typeof chatId === 'number' || /^-?\d+$/.test(String(chatId));
}

function validateMessage(message) {
  if (typeof message !== 'string') return false;
  if (message.length === 0 || message.length > 4096) return false;
  return true;
}

function validatePhotoUrl(url) {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

// Rate limiting - simple in-memory store
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const window = now - windowMs;
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, []);
  }
  
  const requests = rateLimitStore.get(identifier).filter(t => t > window);
  
  if (requests.length >= maxRequests) {
    return false;
  }
  
  requests.push(now);
  rateLimitStore.set(identifier, requests);
  return true;
}

// Cleanup old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of rateLimitStore.entries()) {
    if (times.length === 0 || times[times.length - 1] < now - 300000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// Initialize bot
function initBot(token) {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }
    
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
  } catch (e) {
    console.error('Failed to initialize bot:', e.message);
    bot = null;
    throw e;
  }
}

// API Routes

// Set bot token - require admin key
app.post('/api/config', (req, res) => {
  try {
    // Rate limiting
    if (!checkRateLimit(req.ip, 5, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { botToken, adminKey } = req.body;
    
    // Require admin key for config changes
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      console.warn('Unauthorized config change attempt from', req.ip);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!botToken) {
      return res.status(400).json({ error: 'Bot token required' });
    }
    
    config.botToken = botToken;
    saveConfig(config);
    
    try {
      initBot(botToken);
      res.json({ success: true, message: 'Bot configured and started' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to initialize bot: ' + e.message });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get config status (safe endpoint)
app.get('/api/config', (req, res) => {
  res.json({ 
    configured: !!config.botToken,
    channels: config.channels.map(c => ({ chatId: c.chatId, name: c.name }))
  });
});

// Add channel - require admin key
app.post('/api/channels', (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { chatId, name, adminKey } = req.body;
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      console.warn('Unauthorized channel add attempt from', req.ip);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!validateChatId(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }
    
    // Check for duplicates
    if (config.channels.some(c => c.chatId === chatId)) {
      return res.status(400).json({ error: 'Channel already exists' });
    }
    
    config.channels.push({ 
      chatId: parseInt(chatId), 
      name: typeof name === 'string' ? name.slice(0, 100) : String(chatId)
    });
    saveConfig(config);
    
    res.json({ 
      success: true, 
      channels: config.channels.map(c => ({ chatId: c.chatId, name: c.name }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove channel - require admin key
app.delete('/api/channels/:chatId', (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { adminKey } = req.body;
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      console.warn('Unauthorized channel delete attempt from', req.ip);
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const chatIdToRemove = parseInt(req.params.chatId);
    if (!validateChatId(chatIdToRemove)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    config.channels = config.channels.filter(c => c.chatId !== chatIdToRemove);
    saveConfig(config);
    
    res.json({ 
      success: true, 
      channels: config.channels.map(c => ({ chatId: c.chatId, name: c.name }))
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message to one channel
app.post('/api/send', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 5, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { chatId, message, parseMode = 'Markdown' } = req.body;
    
    if (!bot) {
      return res.status(400).json({ error: 'Bot not configured' });
    }
    
    if (!validateChatId(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    if (!validateMessage(message)) {
      return res.status(400).json({ error: 'Invalid message' });
    }
    
    if (!['Markdown', 'HTML'].includes(parseMode)) {
      return res.status(400).json({ error: 'Invalid parse mode' });
    }
    
    try {
      const result = await bot.sendMessage(parseInt(chatId), message, { parse_mode: parseMode });
      res.json({ success: true, messageId: result.message_id });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send to all configured channels
app.post('/api/broadcast', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 3, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { message, parseMode = 'Markdown', delayMs = 2000 } = req.body;
    
    if (!bot) {
      return res.status(400).json({ error: 'Bot not configured' });
    }
    if (!config.channels.length) {
      return res.status(400).json({ error: 'No channels configured' });
    }
    
    if (!validateMessage(message)) {
      return res.status(400).json({ error: 'Invalid message' });
    }
    
    if (!['Markdown', 'HTML'].includes(parseMode)) {
      return res.status(400).json({ error: 'Invalid parse mode' });
    }
    
    // Limit broadcast frequency
    if (typeof delayMs !== 'number' || delayMs < 1000 || delayMs > 10000) {
      return res.status(400).json({ error: 'Delay must be between 1-10 seconds' });
    }
    
    const results = [];
    for (const channel of config.channels) {
      try {
        await bot.sendMessage(parseInt(channel.chatId), message, { parse_mode: parseMode });
        results.push({ chatId: channel.chatId, name: channel.name, success: true });
      } catch (e) {
        results.push({ chatId: channel.chatId, name: channel.name, success: false, error: e.message });
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send photo with caption
app.post('/api/send-photo', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip, 5, 60000)) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    const { chatId, photoUrl, caption, parseMode = 'Markdown' } = req.body;
    
    if (!bot) {
      return res.status(400).json({ error: 'Bot not configured' });
    }
    
    if (!validateChatId(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID' });
    }
    
    if (!validatePhotoUrl(photoUrl)) {
      return res.status(400).json({ error: 'Invalid photo URL' });
    }
    
    if (caption && !validateMessage(caption)) {
      return res.status(400).json({ error: 'Invalid caption' });
    }
    
    try {
      const result = await bot.sendPhoto(parseInt(chatId), photoUrl, { 
        caption, 
        parse_mode: parseMode 
      });
      res.json({ success: true, messageId: result.message_id });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
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

👉 [Participate Now](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)`
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

// Error handler middleware
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
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

${config.botToken ? '✅ Bot is active' : '⚠️ Bot not configured - POST /api/config with botToken and adminKey'}

Endpoints:
  POST /api/config      - Set bot token (requires adminKey)
  GET  /api/config      - Get config status
  POST /api/channels    - Add a channel (requires adminKey)
  DELETE /api/channels/:chatId - Remove channel (requires adminKey)
  POST /api/send        - Send to one chat
  POST /api/broadcast   - Send to all channels
  POST /api/send-photo  - Send photo with caption
  GET  /api/templates   - Get message templates

Set ADMIN_KEY environment variable for admin operations.
`);
});


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
