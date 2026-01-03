import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, make_response
import requests

app = Flask(__name__)

# Database connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/africarailways")

def get_db_conn():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

# Example: fetch AFC balance from Sui RPC
def get_sui_balance(user_address, coin_type):
    rpc_url = os.getenv("SUI_RPC_URL", "https://fullnode.mainnet.sui.io:443")
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getBalance",
        "params": [user_address, coin_type]
    }
    response = requests.post(rpc_url, json=payload).json()
    try:
        return int(response['result']['totalBalance']) / 1_000_000_000
    except Exception:
        return 0.0

# Lookup Sui address by phone number

# Onboard: create a new Sui address for a phone number if not found
def get_wallet_for_phone(phone_number):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT sui_address FROM phone_wallets WHERE phone_number = %s", (phone_number,))
            row = cur.fetchone()
            if row:
                return row['sui_address']
            # Onboard: create a new Sui address (stub logic)
            new_address = create_sui_address_for_phone(phone_number)
            if new_address:
                cur.execute("INSERT INTO phone_wallets (phone_number, sui_address) VALUES (%s, %s)", (phone_number, new_address))
                conn.commit()
                return new_address
            return None

# Stub: Replace with real Sui address creation logic or API call
def create_sui_address_for_phone(phone_number):
    # In production, integrate with a wallet service or Sui key manager
    # Here, we just return a fake address for demonstration
    return "0x" + phone_number[-16:].zfill(32)

@app.route("/ussd", methods=['POST'])
def ussd_handler():
    phone_number = request.values.get("phoneNumber")
    text = request.values.get("text", "")
    afc_coin_type = os.getenv("AFC_COIN_TYPE", "0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::afc::AFC")

    if text == "":
        response = "CON Welcome to Africa Railways\n"
        response += "1. Check AFC Balance\n"
        response += "2. Buy Train Ticket\n"
        response += "3. Market Price"
    elif text == "1":
        user_wallet = get_wallet_for_phone(phone_number)
        if not user_wallet:
            response = "END No wallet linked to this phone number. Please register first."
        else:
            balance = get_sui_balance(user_wallet, afc_coin_type)
            response = f"END Your balance is {balance:,.2f} AFC"
    else:
        response = "END Invalid option."
    return make_response(response, 200)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
