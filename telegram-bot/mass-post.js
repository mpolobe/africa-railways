/**
 * Mass Telegram Posting Script
 * Posts IDO announcement to multiple groups
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = '8524648377:AAFN2HGhkpkEWcuQGf7N1gpEPtItaLN2bJk';
const bot = new TelegramBot(BOT_TOKEN);

const IDO_MESSAGE = `🚀 *SENT IDO IS LIVE ON PINKSALE!*

🛤️ Sentinel ($SENT) - The Investment Engine of Africa Railways

📊 *Token Details:*
• Price: $0.00005 per SENT
• Tokens for Presale: 3,000,000,000 SENT
• SoftCap: 255,000 MATIC
• Network: Polygon

⏰ *Sale Period:* January 19 - January 26, 2026

🔒 730-day liquidity lock for maximum security

👉 [Join the IDO on PinkSale](https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08)

#SENT #AfricaRailways #IDO #PinkSale #Polygon #RWA`;

// Groups where bot is admin (can post directly)
const ADMIN_GROUPS = [
    '@afrcsentinel'
];

// Load additional groups from file
function loadGroups() {
    try {
        const data = JSON.parse(fs.readFileSync('./shill-groups.json', 'utf8'));
        return data.groups || [];
    } catch (e) {
        return [];
    }
}

// Post to a single group
async function postToGroup(chatId, name) {
    try {
        await bot.sendMessage(chatId, IDO_MESSAGE, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false
        });
        console.log(`✅ Posted to ${name}`);
        return { success: true, name };
    } catch (e) {
        console.log(`❌ Failed ${name}: ${e.message}`);
        return { success: false, name, error: e.message };
    }
}

// Mass post with delay to avoid rate limits
async function massPost() {
    console.log('🚀 Starting mass post to Telegram groups...\n');
    
    const results = { success: [], failed: [] };
    
    // Post to groups where bot is admin
    for (const chatId of ADMIN_GROUPS) {
        const result = await postToGroup(chatId, chatId);
        if (result.success) {
            results.success.push(result.name);
        } else {
            results.failed.push({ name: result.name, error: result.error });
        }
        // 3 second delay between posts
        await new Promise(r => setTimeout(r, 3000));
    }
    
    console.log('\n========== RESULTS ==========');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
        console.log('\nFailed groups:');
        results.failed.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
    }
    
    // Generate manual posting list
    const groups = loadGroups();
    console.log('\n========== MANUAL POSTING LIST ==========');
    console.log('Join these groups and post manually:\n');
    groups.forEach(g => {
        console.log(`📌 ${g.name}: https://t.me/${g.username}`);
    });
    
    console.log('\n📋 Message copied to clipboard-ready format below:\n');
    console.log('---');
    console.log(IDO_MESSAGE.replace(/\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1: https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08'));
    console.log('---');
}

massPost().then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
});
