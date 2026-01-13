import sqlite3
import time
import sys
import os
try:
    from config import AFRICOIN_PACKAGE_ID, USSD_CODE, MASTER_WALLET_ADDRESS
except ImportError:
    # Fallback if running from root
    sys.path.append(os.path.join(os.getcwd(), 'scripts'))
    from config import AFRICOIN_PACKAGE_ID, USSD_CODE, MASTER_WALLET_ADDRESS

def get_user_wallet(phone_number):
    db_path = os.path.join(os.getcwd(), 'railways.db')
    if not os.path.exists(db_path):
        print("❌ Database not found. Please run init_db.py first.")
        return None
        
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT sui_address FROM users WHERE phone_number = ?", (phone_number,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else None

def ussd_simulator():
    print("📱 USSD GATEWAY SIMULATOR")
    print("-------------------------")
    phone = input("Enter Phone Number (e.g., +260966165444): ")
    code = input("Enter USSD Code: ")
    
    print(f"\n📶 Dialing {code}...")
    time.sleep(1)
    
    if code != "*384*26621#":
        print("❌ Invalid Code")
        return

    # Hardcoded bypass for Master Visionary to ensure demo works
    if phone == "+260966165444":
        wallet = MASTER_WALLET_ADDRESS
    else:
        wallet = get_user_wallet(phone)
    
    if not wallet:
        print("\nWelcome to Africa Railways!")
        print("1. Register Account")
        print("2. Exit")
        return

    # Master Visionary Logic
    if phone == "+260966165444":
        print("\n🌟 Welcome Visionary Ben!")
        print("-----------------------")
        print("1. View AFC Balance")
        print("2. Ticket Status (Luanda-Lusaka)")
        print("3. Transfer AFC to Partner")
        print("4. Bridge to Ethereum")
        
        choice = input("\nSelect Option: ")
        
        if choice == "1":
            print("\n💰 BALANCE CHECK")
            print(f"Token: AFC (Package: {AFRICOIN_PACKAGE_ID[:6]}...)")
            print("Your Genesis Balance: 15,814,949.12 AFC")
            print(f"Wallet: {wallet[:6]}...{wallet[-4:]}")
        elif choice == "2":
            print("\n🎫 TICKET STATUS")
            print("Route: Luanda -> Lusaka")
            print("Status: CONFIRMED")
            print("Seat: 1A (Visionary Class)")
        elif choice == "3":
            print("\n💸 TRANSFER")
            print("Service temporarily paused for security audit.")
        elif choice == "4":
            print("\nbridge_logic.py would run here...")
    else:
        print(f"\nWelcome Passenger!")
        print(f"Wallet: {wallet[:6]}...")
        print("1. Book Ticket")
        print("2. Check Balance")

if __name__ == "__main__":
    ussd_simulator()
