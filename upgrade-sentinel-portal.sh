#!/bin/bash

# Target the files we found in your root
TARGET_FILES=("index.html" "dashboard.html")

for FILE in "${TARGET_FILES[@]}"; do
    if [ -f "/workspaces/africa-railways/$FILE" ]; then
        echo "🛰️  Upgrading $FILE..."
        
        # Create backup
        cp "/workspaces/africa-railways/$FILE" "/workspaces/africa-railways/$FILE.bak"

        # Content to inject
        cat << 'HTML_EOF' > /tmp/sentinel_card.html
        <div class="mt-8 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden" style="margin-top: 2rem;">
            <div class="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 class="text-xl font-bold text-yellow-500">🛰️ Live Activity Feed</h3>
                <span id="engine-heartbeat" class="text-xs font-mono text-green-400">● ENGINE CONNECTED</span>
            </div>
            <div id="activity-log" class="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2 text-slate-300 bg-black/20">
                <div class="text-slate-500 italic">Waiting for Sui network events...</div>
            </div>
            <div class="px-6 py-3 bg-slate-800/30 border-t border-slate-800 flex gap-4">
                <div class="text-xs text-slate-400">Total Supply: <span id="portal-supply" class="text-white">--</span> AFRC</div>
                <div class="text-xs text-slate-400">Minted: <span id="portal-minted" class="text-white">--</span></div>
            </div>
        </div>
        <script>
            async function fetchSentinel() {
                try {
                    const res = await fetch('http://localhost:8080/health');
                    const data = await res.json();
                    document.getElementById('engine-heartbeat').className = "text-xs font-mono text-green-400 animate-pulse";
                    document.getElementById('portal-supply').innerText = data.total_supply;
                    document.getElementById('portal-minted').innerText = data.minted_count;
                    if (data.recent_events && data.recent_events.length > 0) {
                        const log = document.getElementById('activity-log');
                        log.innerHTML = "";
                        data.recent_events.forEach(ev => {
                            const d = document.createElement('div');
                            d.className = "border-l-2 border-yellow-500 pl-3 py-1 bg-yellow-500/5";
                            d.innerHTML = `<span class="text-yellow-600">[${new Date().toLocaleTimeString()}]</span> ${ev.message}`;
                            log.prepend(d);
                        });
                    }
                } catch(e) {
                    document.getElementById('engine-heartbeat').className = "text-xs font-mono text-red-500";
                    document.getElementById('engine-heartbeat').innerText = "○ ENGINE DISCONNECTED";
                }
            }
            setInterval(fetchSentinel, 3000);
            fetchSentinel();
        </script>
HTML_EOF

        # Injecting before the closing body tag
        sed -i "/<\/body>/i $(cat /tmp/sentinel_card.html | tr '\n' ' ')" "/workspaces/africa-railways/$FILE"
        echo "✅ $FILE updated."
    fi
done

echo "🚀 Restarting Backend..."
pkill -f "go run main.go" || true
cd /workspaces/africa-railways/backend && go run main.go &
