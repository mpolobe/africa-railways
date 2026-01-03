import os
import requests

AFC_TREASURY_CAP = os.getenv("AFC_TREASURY_CAP")
AFC_GENESIS_COIN = os.getenv("AFC_GENESIS_COIN")
AFC_COIN_TYPE = os.getenv("AFC_COIN_TYPE", "0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::africoin::AFRICOIN")

SUI_RPC = "https://fullnode.mainnet.sui.io:443"

def check_treasury_cap():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [AFC_TREASURY_CAP]
    }
    resp = requests.post(SUI_RPC, json=payload).json()
    owner = resp['result']['data']['owner']
    print(f"TreasuryCap Owner: {owner}")
    return owner

def check_genesis_coin():
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [AFC_GENESIS_COIN]
    }
    resp = requests.post(SUI_RPC, json=payload).json()
    details = resp['result']['data']['content']['fields']
    balance = int(details['balance']) / 1_000_000_000
    print(f"Genesis Coin Balance: {balance} AFC")
    return balance

if __name__ == "__main__":
    print("Verifying Africoin Assets...")
    check_treasury_cap()
    check_genesis_coin()
