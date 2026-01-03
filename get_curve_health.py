import requests

def get_curve_health(pool_id):
    # This queries the current state of your specific bonding curve
    rpc_url = "https://fullnode.mainnet.sui.io:443"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "sui_getObject",
        "params": [pool_id, {"showContent": True}]
    }
    res = requests.post(rpc_url, json=payload).json()
    content = res['result']['data']['content']['fields']
    sui_reserves = int(content['virtual_sui_amt']) / 1e9
    print(f"🛤️ Rail Corridor Liquidity: {sui_reserves:.2f} SUI")
    return sui_reserves

get_curve_health("0xa4ef8e1885e101d413e904420643ee583fb60e9f8ff43ed9dd0537b65cc4c2bc")
