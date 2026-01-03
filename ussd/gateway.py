import os
import requests

def get_afc_balance(user_address):
    rpc_url = "https://fullnode.mainnet.sui.io:443"
    coin_type = os.getenv("AFC_COIN_TYPE", "0xc685b7e8...::africoin::AFRICOIN")
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "suix_getBalance",
        "params": [
            user_address,
            coin_type
        ]
    }
    response = requests.post(rpc_url, json=payload).json()
    # Convert MIST to AFC (10^9)
    return int(response['result']['totalBalance']) / 1_000_000_000
