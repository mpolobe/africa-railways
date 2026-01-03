import os
import telebot
import requests
from dotenv import load_dotenv

load_dotenv()  # Load from root folder

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
POOL_ID = os.getenv("AFC_POOL_ID", "0xa4ef8e1885e101d413e904420643ee583fb60e9f8ff43ed9dd0537b65cc4c2bc")
SUI_RPC = "https://fullnode.mainnet.sui.io:443"

bot = telebot.TeleBot(TOKEN)

MOVEPUMP_TRADE_URL = f"https://movepump.xyz/trade/{POOL_ID}"


def get_afc_price():
    payload = {
        "jsonrpc": "2.0", "id": 1, "method": "sui_getObject",
        "params": [POOL_ID, {"showContent": True}]
    }
    res = requests.post(SUI_RPC, json=payload).json()
    fields = res['result']['data']['content']['fields']
    sui_res = int(fields['virtual_sui_reserves'])
    afc_res = int(fields['virtual_token_reserves'])
    price = sui_res / afc_res if afc_res else 0
    return price


@bot.message_handler(commands=['price', 'start'])
def send_price(message):
    price = get_afc_price()
    market_cap = price * 1_000_000_000  # 1B Supply
    text = (
        f"🚂 *Africoin (AFC) Market Update*\n\n"
        f"💰 *Price:* {price:.10f} SUI\n"
        f"📊 *Market Cap:* {market_cap:,.2f} SUI\n"
        f"🛤️ *Corridor Status:* Active\n\n"
        f"[Buy Now on MovePump]({MOVEPUMP_TRADE_URL})\n\n"
        f"Dial `*384*26621#` for USSD Access"
    )
    bot.reply_to(message, text, parse_mode='Markdown')

print("🤖 Africoin Price Bot is running...")
bot.polling()
