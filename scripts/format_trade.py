import json

# Your verified Trade Event data
trade_event = {
    "token_amount": "15814949120593",
    "sui_amount": "792000001",
    "token_address": "c68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::afc::AFC"
}

def format_trade(event):
    # Convert from raw blockchain units to human readable
    afc_amount = int(event["token_amount"]) / 1_000_000
    sui_spent = int(event["sui_amount"]) / 1_000_000_000
    print(f"✅ Success: {afc_amount:,.2f} AFC purchased for {sui_spent:.4f} SUI")
    return afc_amount

format_trade(trade_event)
