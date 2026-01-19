const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
const fs = require('fs');

const API_ID = 32685049;
const API_HASH = 'ecad5118160ed8989eba07da66faf0c1';
const PHONE = '+18782069446';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function login() {
    console.log('🔐 Logging into Telegram...\n');
    
    const client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
        connectionRetries: 5,
    });
    
    await client.start({
        phoneNumber: PHONE,
        phoneCode: async () => await ask('Enter the code Telegram sent you: '),
        password: async () => await ask('Enter 2FA password (or press Enter if none): '),
        onError: (err) => console.log('Error:', err),
    });
    
    // Save session
    const session = client.session.save();
    fs.writeFileSync('session.txt', session);
    console.log('\n✅ Session saved!\n');
    
    // Get user info
    const me = await client.getMe();
    console.log(`Logged in as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})\n`);
    
    // Get dialogs (groups)
    const dialogs = await client.getDialogs({ limit: 100 });
    const groups = dialogs.filter(d => d.isGroup || d.isChannel);
    
    console.log(`Found ${groups.length} groups/channels:\n`);
    groups.forEach((g, i) => {
        console.log(`${i + 1}. ${g.title} (${g.id})`);
    });
    
    // Save groups list
    const groupList = groups.map(g => ({
        id: g.id.toString(),
        title: g.title,
        isChannel: g.isChannel
    }));
    fs.writeFileSync('groups.json', JSON.stringify(groupList, null, 2));
    console.log('\n✅ Groups saved to groups.json');
    
    rl.close();
    await client.disconnect();
}

login().catch(e => {
    console.log('Error:', e.message);
    rl.close();
});
