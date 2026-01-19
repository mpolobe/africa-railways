/**
 * Telegram Posting Script for Africa Railways Website
 * Posts messages directly to @afrcsentinel group
 */

const TELEGRAM_BOT_TOKEN = '8524648377:AAFN2HGhkpkEWcuQGf7N1gpEPtItaLN2bJk';
const TELEGRAM_CHAT_ID = '@afrcsentinel';

/**
 * Send a message to Telegram
 * @param {string} message - The message to send (supports Markdown)
 * @param {object} options - Optional settings
 * @returns {Promise<object>} - Telegram API response
 */
async function postToTelegram(message, options = {}) {
    const {
        parseMode = 'Markdown',
        disablePreview = false,
        silent = false
    } = options;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: parseMode,
                disable_web_page_preview: disablePreview,
                disable_notification: silent
            })
        });

        const data = await response.json();
        
        if (data.ok) {
            console.log('✅ Message posted to Telegram');
            return { success: true, messageId: data.result.message_id };
        } else {
            console.error('❌ Telegram error:', data.description);
            return { success: false, error: data.description };
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send a photo with caption to Telegram
 * @param {string} photoUrl - URL of the image
 * @param {string} caption - Caption text (supports Markdown)
 * @returns {Promise<object>} - Telegram API response
 */
async function postPhotoToTelegram(photoUrl, caption = '') {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                photo: photoUrl,
                caption: caption,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();
        return data.ok ? { success: true, messageId: data.result.message_id } : { success: false, error: data.description };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Pre-defined message templates
const TelegramTemplates = {
    idoLive: `🚀 *SENT IDO IS LIVE ON PINKSALE!*

🛤️ Sentinel ($SENT) - Africa Railways Investment Token

💰 Price: $0.00005 per SENT
🔒 730-day liquidity lock
⛓️ Network: Polygon

👉 https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08

#SENT #PinkSale #IDO #Polygon`,

    countdown: `⏰ *IDO COUNTDOWN REMINDER*

SENT IDO ends *January 26, 2026* at 14:00 UTC!

Don't miss your chance to invest in Africa's railway future!

👉 https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08`,

    tokenDifference: `🔄 *AFC vs AFRC vs SENT - What's the Difference?*

*AFC (Africoin)*
🎫 The ticketing token
• Used for buying train tickets
• Runs on Sui blockchain
• For daily passenger transactions

*AFRC (Africa Railways Coin)*
🏛️ The ecosystem token
• Represents the Africa Railways brand
• Community rewards & incentives

*SENT (Sentinel)*
💎 The investment token
• Powers railway infrastructure
• Runs 2,000+ signaling nodes
• Governance & voting rights
• Currently in IDO on PinkSale

Three tokens, one mission: Connecting Africa by rail! 🚂`,

    whyInvest: `💎 *WHY INVEST IN SENTINEL ($SENT)?*

✅ *Real Infrastructure* - Backing African High Speed Railways
✅ *Utility* - Powers 2,000+ signaling worker nodes
✅ *Security* - 730-day liquidity lock
✅ *Governance* - Network decision-making rights

This isn't just crypto - it's infrastructure investment.

👉 https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08`,

    howToBuy: `📖 *HOW TO BUY SENT*

1️⃣ Get MetaMask or Trust Wallet
2️⃣ Add Polygon network
3️⃣ Buy MATIC and send to your wallet
4️⃣ Go to PinkSale link below
5️⃣ Connect wallet & contribute

👉 https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08

Need help? Ask in this group!`
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { postToTelegram, postPhotoToTelegram, TelegramTemplates };
}
