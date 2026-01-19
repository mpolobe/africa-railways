/**
 * Social Media Posting API
 * Supports: Telegram, Discord, Twitter/X (with API key)
 */

const express = require('express');
const router = express.Router();

// Environment variables needed:
// TELEGRAM_BOT_TOKEN - from @BotFather
// TELEGRAM_CHANNEL_ID - your channel ID (e.g., @africarailways or -1001234567890)
// DISCORD_WEBHOOK_URL - from Discord channel settings
// TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET

async function postToTelegram(message, imageUrl = null) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;
    
    if (!token || !chatId) {
        return { success: false, error: 'Telegram not configured' };
    }
    
    try {
        const url = imageUrl 
            ? `https://api.telegram.org/bot${token}/sendPhoto`
            : `https://api.telegram.org/bot${token}/sendMessage`;
        
        const body = imageUrl
            ? { chat_id: chatId, photo: imageUrl, caption: message, parse_mode: 'HTML' }
            : { chat_id: chatId, text: message, parse_mode: 'HTML' };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        return { success: data.ok, platform: 'telegram', data };
    } catch (error) {
        return { success: false, platform: 'telegram', error: error.message };
    }
}

async function postToDiscord(message, imageUrl = null) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        return { success: false, error: 'Discord not configured' };
    }
    
    try {
        const embed = {
            description: message,
            color: 0xFFD700, // Gold color
            footer: { text: 'Africa Railways | SENT IDO' },
            timestamp: new Date().toISOString()
        };
        
        if (imageUrl) {
            embed.image = { url: imageUrl };
        }
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Africa Railways',
                embeds: [embed]
            })
        });
        
        return { success: response.ok, platform: 'discord' };
    } catch (error) {
        return { success: false, platform: 'discord', error: error.message };
    }
}

async function postToTwitter(message) {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;
    
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        return { success: false, error: 'Twitter not configured - requires paid API ($100/mo)' };
    }
    
    // Twitter API v2 requires OAuth 1.0a signing
    // For production, use a library like 'twitter-api-v2'
    try {
        const { TwitterApi } = require('twitter-api-v2');
        const client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessSecret,
        });
        
        const tweet = await client.v2.tweet(message);
        return { success: true, platform: 'twitter', data: tweet };
    } catch (error) {
        return { success: false, platform: 'twitter', error: error.message };
    }
}

// API endpoint for posting
router.post('/post', async (req, res) => {
    const { message, platforms, imageUrl, adminKey } = req.body;
    
    // Simple admin authentication
    if (adminKey !== process.env.SOCIAL_ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    const results = [];
    const targetPlatforms = platforms || ['telegram', 'discord'];
    
    for (const platform of targetPlatforms) {
        switch (platform) {
            case 'telegram':
                results.push(await postToTelegram(message, imageUrl));
                break;
            case 'discord':
                results.push(await postToDiscord(message, imageUrl));
                break;
            case 'twitter':
                results.push(await postToTwitter(message));
                break;
        }
    }
    
    res.json({ 
        success: results.some(r => r.success),
        results 
    });
});

// Get configuration status
router.get('/status', (req, res) => {
    res.json({
        telegram: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHANNEL_ID,
        discord: !!process.env.DISCORD_WEBHOOK_URL,
        twitter: !!process.env.TWITTER_API_KEY
    });
});

module.exports = router;
