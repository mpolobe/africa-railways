from flask import Flask, request, make_response
import requests
import os

app = Flask(__name__)

# Constants from our Genesis data
def get_afc_coin_type():
    return os.getenv("AFC_COIN_TYPE", "0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::afc::AFC")

# Example: fetch AFC balance from Sui RPC
def get_sui_balance(user_address, coin_type):
    rpc_url = "https://fullnode.mainnet.sui.io:443"
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

@app.route("/ussd", methods=['POST'])
def ussd_handler():
    # 1. Get data from Africa's Talking
    phone_number = request.values.get("phoneNumber")
    text = request.values.get("text", "")

    # 2. Basic Menu Logic
    if text == "":
        response = "CON Welcome to Africa Railways\n"
        response += "1. Check AFC Balance\n"
        response += "2. Buy Train Ticket\n"
        response += "3. Market Price"
    elif text == "1":
        # In production, look up the Sui Address linked to this phone number
        user_wallet = "0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8"
        balance = get_sui_balance(user_wallet, get_afc_coin_type())
        response = f"END Your balance is {balance:,.2f} AFC"
    else:
        response = "END Invalid option."
    return make_response(response, 200)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
