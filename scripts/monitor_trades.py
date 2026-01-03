
import os
import requests
import time

# Set these in your .env or environment
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "@AfricoinCommunity")
SUI_RPC = "https://fullnode.mainnet.sui.io:443"

# Replace with your actual pool object ID
POOL_OBJECT_ID = os.getenv("AFC_POOL_ID", "0xa4ef8e1885e101d413e904420643ee583fb60e9f8ff43ed9dd0537b65cc4c2bc")

last_price = None

# Example trade event for formatting
trade_event = {
    "token_amount": "15814949120593",
    "sui_amount": "792000001",
    "token_address": "c68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::afc::AFC"
}

def fetch_reserves():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [POOL_OBJECT_ID]
    }
    resp = requests.post(SUI_RPC, json=payload).json()
    fields = resp['result']['data']['content']['fields']
    virtual_sui_reserves = int(fields['virtual_sui_reserves'])
    virtual_token_reserves = int(fields['virtual_token_reserves'])
    return virtual_token_reserves, virtual_sui_reserves

def get_price():
    token_reserves, sui_reserves = fetch_reserves()
    return token_reserves / sui_reserves if sui_reserves else 0

def send_telegram_message(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message}
    r = requests.post(url, data=payload)
    if not r.ok:
        print(f"Failed to send Telegram message: {r.text}")

def format_trade(event):
    afc_amount = int(event["token_amount"]) / 1_000_000
    sui_spent = int(event["sui_amount"]) / 1_000_000_000
    print(f"✅ Success: {afc_amount:,.2f} AFC purchased for {sui_spent:.4f} SUI")
    return afc_amount

def monitor_price():
    global last_price
    print("Starting AFC price monitor...")
    while True:
        price = get_price()
        if last_price is not None:
            change = abs(price - last_price) / last_price
            if change >= 0.05:
                msg = f"$AFC price update: {price:.8f} SUI per AFC (moved {change*100:.2f}%)"
                send_telegram_message(msg)
                print(msg)
                last_price = price
        else:
            last_price = price
        time.sleep(60)  # Check every 60 seconds

if __name__ == "__main__":
    format_trade(trade_event)
    monitor_price()
