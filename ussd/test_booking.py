#!/usr/bin/env python3
"""
Africa Railways USSD Booking Simulator
Tests the complete booking flow via simulated Africa's Talking callbacks

Usage:
    python ussd/test_booking.py

Flow tested:
    *123*RAIL# → Book Ticket → Select Route → Select Date → Select Class → Confirm → Pay
"""

import requests
import os
import sys
import time
from datetime import datetime

# Configuration
SERVER_URL = os.getenv('USSD_SERVER_URL', 'http://localhost:5000')
USSD_ENDPOINT = f"{SERVER_URL}/ussd"

# Test phone numbers (Zambia, Tanzania, Kenya)
TEST_PHONES = {
    "zambia": "+260966165444",
    "tanzania": "+255712345678",
    "kenya": "+254712345678"
}

# Session tracking
session_counter = 0

def get_session_id():
    global session_counter
    session_counter += 1
    return f"AT_Test_Session_{session_counter}_{int(time.time())}"


def simulate_ussd(phone_number, text, session_id=None):
    """
    Simulate Africa's Talking USSD callback
    """
    if session_id is None:
        session_id = get_session_id()
    
    payload = {
        'sessionId': session_id,
        'phoneNumber': phone_number,
        'networkCode': '64501',  # MTN
        'serviceCode': '*123*RAIL#',
        'text': text
    }
    
    try:
        response = requests.post(USSD_ENDPOINT, data=payload, timeout=10)
        return response.text, session_id
    except requests.exceptions.ConnectionError:
        return None, session_id
    except Exception as e:
        return f"ERROR: {str(e)}", session_id


def print_screen(title, response, input_text=""):
    """Pretty print USSD screen"""
    print("\n" + "=" * 50)
    print(f"📱 {title}")
    if input_text:
        print(f"   Input: {input_text}")
    print("=" * 50)
    if response:
        # Format response nicely
        lines = response.replace("CON ", "").replace("END ", "").strip().split("\n")
        for line in lines:
            print(f"   {line}")
    else:
        print("   ❌ No response (server not running?)")
    print("=" * 50)


def test_full_booking_flow(phone_number, country):
    """
    Test complete booking flow
    """
    print("\n" + "🚂" * 25)
    print(f"   AFRICA RAILWAYS USSD BOOKING TEST")
    print(f"   Phone: {phone_number} ({country.upper()})")
    print(f"   Server: {SERVER_URL}")
    print("🚂" * 25)
    
    session_id = get_session_id()
    
    # Step 1: Dial USSD code (Main Menu)
    print("\n📞 Step 1: Dial *123*RAIL#")
    response, session_id = simulate_ussd(phone_number, "", session_id)
    print_screen("Main Menu", response)
    
    if response is None:
        print("\n❌ Server not running. Start with: python ussd/booking.py")
        return False
    
    input("\nPress Enter to continue to booking...")
    
    # Step 2: Select "Book Ticket" (option 1)
    print("\n📞 Step 2: Select 'Book Ticket' (1)")
    response, session_id = simulate_ussd(phone_number, "1", session_id)
    print_screen("Route Selection", response, "1")
    
    input("\nPress Enter to select route...")
    
    # Step 3: Select route (option 1 = Kapiri-Dar)
    print("\n📞 Step 3: Select Route (1 = Kapiri-Dar)")
    response, session_id = simulate_ussd(phone_number, "1*1", session_id)
    print_screen("Date Selection", response, "1*1")
    
    input("\nPress Enter to select date...")
    
    # Step 4: Select date (option 1 = tomorrow)
    print("\n📞 Step 4: Select Date (1 = Tomorrow)")
    response, session_id = simulate_ussd(phone_number, "1*1*1", session_id)
    print_screen("Class Selection", response, "1*1*1")
    
    input("\nPress Enter to select class...")
    
    # Step 5: Select class (option 1 = Economy)
    print("\n📞 Step 5: Select Class (1 = Economy)")
    response, session_id = simulate_ussd(phone_number, "1*1*1*1", session_id)
    print_screen("Booking Confirmation", response, "1*1*1*1")
    
    input("\nPress Enter to confirm booking...")
    
    # Step 6: Confirm booking (option 1)
    print("\n📞 Step 6: Confirm & Pay (1)")
    response, session_id = simulate_ussd(phone_number, "1*1*1*1*1", session_id)
    print_screen("Booking Result", response, "1*1*1*1*1")
    
    # Check if booking was successful
    if response and "Confirmed" in response:
        print("\n✅ BOOKING SUCCESSFUL!")
        return True
    else:
        print("\n❌ Booking may have failed")
        return False


def test_check_booking(phone_number):
    """Test checking an existing booking"""
    print("\n" + "=" * 50)
    print("   TEST: Check Existing Booking")
    print("=" * 50)
    
    session_id = get_session_id()
    
    # Main menu
    response, session_id = simulate_ussd(phone_number, "", session_id)
    print_screen("Main Menu", response)
    
    # Select "Check Booking" (option 2)
    response, session_id = simulate_ussd(phone_number, "2", session_id)
    print_screen("Enter Reference", response, "2")
    
    # Enter booking reference
    response, session_id = simulate_ussd(phone_number, "2*AR12345678", session_id)
    print_screen("Booking Details", response, "2*AR12345678")


def test_afc_balance(phone_number):
    """Test AFC balance check"""
    print("\n" + "=" * 50)
    print("   TEST: Check AFC Balance")
    print("=" * 50)
    
    session_id = get_session_id()
    
    # Main menu
    response, session_id = simulate_ussd(phone_number, "", session_id)
    
    # Select "AFC Balance" (option 3)
    response, session_id = simulate_ussd(phone_number, "3", session_id)
    print_screen("AFC Balance", response, "3")


def test_help(phone_number):
    """Test help menu"""
    print("\n" + "=" * 50)
    print("   TEST: Help Menu")
    print("=" * 50)
    
    session_id = get_session_id()
    
    # Main menu
    response, session_id = simulate_ussd(phone_number, "", session_id)
    
    # Select "Help" (option 4)
    response, session_id = simulate_ussd(phone_number, "4", session_id)
    print_screen("Help", response, "4")


def run_all_tests():
    """Run all USSD tests"""
    phone = TEST_PHONES["zambia"]
    
    print("\n" + "🧪" * 25)
    print("   RUNNING ALL USSD TESTS")
    print("🧪" * 25)
    
    # Test 1: Full booking flow
    print("\n\n📋 TEST 1: Full Booking Flow")
    test_full_booking_flow(phone, "zambia")
    
    # Test 2: Check booking
    print("\n\n📋 TEST 2: Check Booking")
    test_check_booking(phone)
    
    # Test 3: AFC Balance
    print("\n\n📋 TEST 3: AFC Balance")
    test_afc_balance(phone)
    
    # Test 4: Help
    print("\n\n📋 TEST 4: Help Menu")
    test_help(phone)
    
    print("\n\n" + "✅" * 25)
    print("   ALL TESTS COMPLETED")
    print("✅" * 25)


def interactive_mode():
    """Interactive USSD testing"""
    print("\n" + "=" * 50)
    print("   INTERACTIVE USSD MODE")
    print("   Type USSD inputs, 'reset' to restart, 'quit' to exit")
    print("=" * 50)
    
    phone = TEST_PHONES["zambia"]
    session_id = get_session_id()
    current_input = ""
    
    while True:
        # Show current state
        response, session_id = simulate_ussd(phone, current_input, session_id)
        print_screen(f"USSD Screen (input: '{current_input}')", response)
        
        if response and response.startswith("END"):
            print("\n📱 Session ended. Starting new session...")
            session_id = get_session_id()
            current_input = ""
            continue
        
        # Get user input
        user_input = input("\n📱 Enter option (or 'reset'/'quit'): ").strip()
        
        if user_input.lower() == 'quit':
            break
        elif user_input.lower() == 'reset':
            session_id = get_session_id()
            current_input = ""
            print("\n🔄 Session reset")
        else:
            if current_input:
                current_input = f"{current_input}*{user_input}"
            else:
                current_input = user_input


if __name__ == "__main__":
    print("\n🚂 Africa Railways USSD Booking Tester")
    print("=" * 50)
    print("Options:")
    print("  1. Run full booking test")
    print("  2. Run all tests")
    print("  3. Interactive mode")
    print("  4. Quick server check")
    print("=" * 50)
    
    choice = input("\nSelect option (1-4): ").strip()
    
    if choice == "1":
        country = input("Country (zambia/tanzania/kenya) [zambia]: ").strip() or "zambia"
        phone = TEST_PHONES.get(country, TEST_PHONES["zambia"])
        test_full_booking_flow(phone, country)
    elif choice == "2":
        run_all_tests()
    elif choice == "3":
        interactive_mode()
    elif choice == "4":
        print("\n🔍 Checking server...")
        response, _ = simulate_ussd(TEST_PHONES["zambia"], "")
        if response:
            print("✅ Server is running!")
            print_screen("Main Menu", response)
        else:
            print("❌ Server not responding")
            print(f"   Expected at: {USSD_ENDPOINT}")
            print("\n   Start server with: python ussd/booking.py")
    else:
        print("Invalid option")
