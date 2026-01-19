const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const API_ID = 32685049;
const API_HASH = 'ecad5118160ed8989eba07da66faf0c1';

let client = null;
let phoneCodeHash = null;

// Step 1: Send code
app.post('/send-code', async (req, res) => {
    const { phone } = req.body;
    try {
        client = new TelegramClient(new StringSession(''), API_ID, API_HASH, {
            connectionRetries: 5,
        });
        await client.connect();
        
        const result = await client.sendCode({ apiId: API_ID, apiHash: API_HASH }, phone);
        phoneCodeHash = result.phoneCodeHash;
        
        res.json({ success: true, message: 'Code sent to your Telegram' });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Step 2: Verify code
app.post('/verify-code', async (req, res) => {
    const { phone, code } = req.body;
    try {
        await client.invoke(new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash: phoneCodeHash,
            phoneCode: code
        }));
        
        // Save session
        const session = client.session.save();
        fs.writeFileSync('session.txt', session);
        
        const me = await client.getMe();
        res.json({ 
            success: true, 
            user: { firstName: me.firstName, username: me.username }
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Get groups
app.get('/groups', async (req, res) => {
    try {
        if (!client || !client.connected) {
            // Try to restore session
            const sessionStr = fs.existsSync('session.txt') ? fs.readFileSync('session.txt', 'utf8') : '';
            client = new TelegramClient(new StringSession(sessionStr), API_ID, API_HASH, {
                connectionRetries: 5,
            });
            await client.connect();
        }
        
        const dialogs = await client.getDialogs({ limit: 100 });
        const groups = dialogs
            .filter(d => d.isGroup || d.isChannel)
            .map(d => ({
                id: d.id.toString(),
                title: d.title,
                isChannel: d.isChannel,
                username: d.entity?.username || null
            }));
        
        res.json({ success: true, groups });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Send message to group
app.post('/send', async (req, res) => {
    const { groupId, message } = req.body;
    try {
        await client.sendMessage(groupId, { message });
        res.json({ success: true });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// Mass send
app.post('/mass-send', async (req, res) => {
    const { groupIds, message, delayMs = 5000 } = req.body;
    const results = [];
    
    for (const groupId of groupIds) {
        try {
            await client.sendMessage(groupId, { message });
            results.push({ groupId, success: true });
            console.log(`✅ Sent to ${groupId}`);
        } catch (e) {
            results.push({ groupId, success: false, error: e.message });
            console.log(`❌ Failed ${groupId}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, delayMs));
    }
    
    res.json({ results });
});

// Login page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Telegram Login - Africa Railways</title>
    <style>
        body { font-family: system-ui; background: #0a0e1a; color: #e0e0e0; padding: 40px; }
        .container { max-width: 500px; margin: 0 auto; }
        h1 { color: #f4b41a; }
        input, button { padding: 12px; margin: 10px 0; width: 100%; border-radius: 8px; border: 1px solid #333; }
        input { background: #141b2d; color: #fff; }
        button { background: #f4b41a; color: #000; font-weight: bold; cursor: pointer; }
        .status { padding: 15px; border-radius: 8px; margin: 15px 0; }
        .success { background: rgba(0,255,0,0.1); border: 1px solid #0f0; }
        .error { background: rgba(255,0,0,0.1); border: 1px solid #f00; }
        #groups { margin-top: 20px; }
        .group { padding: 10px; background: #141b2d; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; }
        .group button { width: auto; padding: 8px 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Telegram Login</h1>
        
        <div id="step1">
            <p>Enter your phone number to receive a login code:</p>
            <input type="text" id="phone" value="+18782069446" placeholder="+1234567890">
            <button onclick="sendCode()">Send Code</button>
        </div>
        
        <div id="step2" style="display:none">
            <p>Enter the code sent to your Telegram:</p>
            <input type="text" id="code" placeholder="12345">
            <button onclick="verifyCode()">Verify</button>
        </div>
        
        <div id="step3" style="display:none">
            <h2>✅ Logged In!</h2>
            <p id="userInfo"></p>
            <button onclick="loadGroups()">Load My Groups</button>
            <div id="groups"></div>
            
            <h3 style="margin-top:30px">Mass Post</h3>
            <textarea id="message" rows="6" style="width:100%;background:#141b2d;color:#fff;border:1px solid #333;border-radius:8px;padding:10px;">🚀 SENT IDO IS LIVE ON PINKSALE!

🛤️ Sentinel ($SENT) - Africa Railways Investment Token

💰 Price: $0.00005 per SENT
🔒 730-day liquidity lock
⛓️ Network: Polygon

👉 https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08

#SENT #PinkSale #IDO #Polygon</textarea>
            <button onclick="massSend()">📢 Post to All Selected Groups</button>
            <div id="results"></div>
        </div>
        
        <div id="status"></div>
    </div>
    
    <script>
        let selectedGroups = [];
        
        async function sendCode() {
            const phone = document.getElementById('phone').value;
            showStatus('Sending code...', '');
            
            const res = await fetch('/send-code', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('step1').style.display = 'none';
                document.getElementById('step2').style.display = 'block';
                showStatus('Code sent! Check your Telegram.', 'success');
            } else {
                showStatus('Error: ' + data.error, 'error');
            }
        }
        
        async function verifyCode() {
            const phone = document.getElementById('phone').value;
            const code = document.getElementById('code').value;
            showStatus('Verifying...', '');
            
            const res = await fetch('/verify-code', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ phone, code })
            });
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';
                document.getElementById('userInfo').textContent = 'Welcome, ' + data.user.firstName + '!';
                showStatus('Logged in successfully!', 'success');
            } else {
                showStatus('Error: ' + data.error, 'error');
            }
        }
        
        async function loadGroups() {
            showStatus('Loading groups...', '');
            const res = await fetch('/groups');
            const data = await res.json();
            
            if (data.success) {
                const container = document.getElementById('groups');
                container.innerHTML = '<h3>Your Groups (' + data.groups.length + ')</h3>';
                data.groups.forEach(g => {
                    container.innerHTML += \`
                        <div class="group">
                            <label>
                                <input type="checkbox" value="\${g.id}" onchange="toggleGroup('\${g.id}')">
                                \${g.title}
                            </label>
                        </div>
                    \`;
                });
                showStatus('Loaded ' + data.groups.length + ' groups', 'success');
            } else {
                showStatus('Error: ' + data.error, 'error');
            }
        }
        
        function toggleGroup(id) {
            if (selectedGroups.includes(id)) {
                selectedGroups = selectedGroups.filter(g => g !== id);
            } else {
                selectedGroups.push(id);
            }
        }
        
        async function massSend() {
            if (selectedGroups.length === 0) {
                showStatus('Select at least one group', 'error');
                return;
            }
            
            const message = document.getElementById('message').value;
            showStatus('Posting to ' + selectedGroups.length + ' groups...', '');
            
            const res = await fetch('/mass-send', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ groupIds: selectedGroups, message, delayMs: 5000 })
            });
            const data = await res.json();
            
            const success = data.results.filter(r => r.success).length;
            const failed = data.results.filter(r => !r.success).length;
            showStatus(\`Done! ✅ \${success} sent, ❌ \${failed} failed\`, success > 0 ? 'success' : 'error');
        }
        
        function showStatus(msg, type) {
            const el = document.getElementById('status');
            el.textContent = msg;
            el.className = 'status ' + type;
        }
    </script>
</body>
</html>
    `);
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(\`
🚀 Telegram Marketing Tool
==========================

Open in browser: http://localhost:\${PORT}

1. Enter your phone number
2. Enter the code from Telegram
3. Select groups and mass post!
    \`);
});
