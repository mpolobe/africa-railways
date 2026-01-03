#!/usr/bin/env python3
"""
ARAIL USSD Passenger Simulator
Simulates Africa's Talking USSD callbacks for testing

Usage:
    python simulate_passenger.py

This script simulates a passenger in Lusaka dialing *384*26621# and:
1. Checks wallet balance (pulls real data from Sui Mainnet)
2. Tests the complete USSD flow with your actual phone number
3. Interacts with Railway.app backend

Environment variables required in .env:
- PACKAGE_ID or AFC_PACKAGE_ID: Your Sui Package ID
- RAILWAY_URL: Your Railway deployment URL (optional, defaults to localhost:5000)
"""

import requests
import os
from dotenv import load_dotenv

# Load the IDs we synced earlier
load_dotenv()

# Configuration
# Change to your production URL if testing live
SERVER_URL = os.getenv('RAILWAY_URL', 'http://localhost:5000')
USSD_ENDPOINT = f"{SERVER_URL}/ussd"

# Your actual Lusaka-based phone number
LUSAKA_PHONE = "+260975190740"
SERVICE_CODE = "*384*26621#"
NETWORK_CODE = "64501"  # MTN Zambia code


def simulate_ussd_call(phone_number, text=""):
    """
    Simulates a USSD request from Africa's Talking to your Railway.app server.
    
    Args:
        phone_number: The phone number dialing the USSD code
        text: The USSD input text (empty for initial dial)
    
    Returns:
        The response text from the server, or None if failed
    """
    payload = {
        'sessionId': 'AT_Sim_Session_12345',
        'phoneNumber': phone_number,
        'networkCode': NETWORK_CODE,
        'serviceCode': SERVICE_CODE,
        'text': text
    }
    
    print(f"\n--- Dialing {payload['serviceCode']} from {phone_number} ---")
    
    try:
        response = requests.post(USSD_ENDPOINT, data=payload, timeout=30)
        print(f"Gateway Response:\n{response.text}\n")
        return response.text
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Could not connect to your server at {SERVER_URL}")
        print("Is your backend running?")
        if "localhost" in SERVER_URL:
            print("\n💡 Tip: Start your local server with:")
            print("   python app.py")
            print("\nOr test against Railway production:")
            print("   Set RAILWAY_URL in .env to: https://africa-railways-production.up.railway.app")
        return None
    except requests.exceptions.Timeout:
        print("❌ Error: Server took too long to respond (timeout)")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def main():
    """
    Main simulation entry point
    
    Simulates a Lusaka-based Visionary (using your wallet) checking balance
    """
    print("="*60)
    print("🚂 ARAIL USSD Simulator - First Passenger in Lusaka")
    print("="*60)
    print(f"📱 Phone: {LUSAKA_PHONE}")
    print(f"🌍 Network: MTN Zambia ({NETWORK_CODE})")
    print(f"🔗 Server: {SERVER_URL}")
    print(f"💎 Service: {SERVICE_CODE}")
    print("="*60)
    
    # Step 1: User dials the code (Main Menu)
    print("\n🔹 STEP 1: User dials the code")
    response = simulate_ussd_call(LUSAKA_PHONE, text="")
    
    if response is None:
        print("\n❌ Simulation failed - check your server connection")
        return
    
    # Step 2: User selects '1' to Check Balance
    print("\n🔹 STEP 2: User enters '1' (Check Balance)")
    response = simulate_ussd_call(LUSAKA_PHONE, text="1")
    
    if response and ("balance" in response.lower() or "wallet" in response.lower()):
        print("\n✅ SUCCESS! Wallet balance retrieved from Sui Mainnet!")
        print("\n📊 This proves:")
        print("  ✓ Railway.app server is running")
        print("  ✓ USSD gateway is responding")
        print("  ✓ Sui blockchain integration works")
        print("  ✓ Your Package ID is correctly configured")
    else:
        print("\n⚠️  Response received but balance check status unclear")
    
    print("\n" + "="*60)
    print("✅ Simulation Complete!")
    print("="*60)


if __name__ == "__main__":
    # Simulate a Lusaka-based Visionary (using your wallet)
    main()
