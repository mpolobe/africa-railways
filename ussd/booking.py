"""
Africa Railways USSD Booking System
Enables ticket booking via USSD for feature phones

Flow:
*123*RAIL# → Main Menu → Book Ticket → Select Route → Select Date → Select Class → Confirm → Pay

Session data stored in Redis/DB to maintain state across USSD requests
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, make_response
import requests

app = Flask(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", None)
DATABASE_URL = os.getenv("DATABASE_URL", None)
AFC_COIN_TYPE = os.getenv("AFC_COIN_TYPE", "0xc68c4cfb63d702227db09c28837e75abd23bbb3adc192e3bc45fecca4dd5b7e8::afc::AFC")
SUI_RPC_URL = os.getenv("SUI_RPC_URL", "https://fullnode.mainnet.sui.io:443")
WHATSAPP_NUMBER = "+260966165444"

# In-memory session store (use Redis in production)
sessions = {}

# Popular routes with pricing (USD)
ROUTES = {
    "1": {
        "id": "kapiri-dar",
        "name": "Kapiri Mposhi → Dar es Salaam",
        "short": "Kapiri-Dar",
        "operator": "TAZARA",
        "distance": 1860,
        "duration": "48h",
        "prices": {"economy": 50, "business": 90, "sleeper": 150}
    },
    "2": {
        "id": "dar-kapiri",
        "name": "Dar es Salaam → Kapiri Mposhi",
        "short": "Dar-Kapiri",
        "operator": "TAZARA",
        "distance": 1860,
        "duration": "48h",
        "prices": {"economy": 50, "business": 90, "sleeper": 150}
    },
    "3": {
        "id": "lusaka-livingstone",
        "name": "Lusaka → Livingstone",
        "short": "Lusaka-Livingstone",
        "operator": "ZRL",
        "distance": 474,
        "duration": "12h",
        "prices": {"economy": 15, "business": 30, "sleeper": 50}
    },
    "4": {
        "id": "nairobi-mombasa",
        "name": "Nairobi → Mombasa",
        "short": "Nairobi-Mombasa",
        "operator": "SGR Kenya",
        "distance": 472,
        "duration": "4.5h",
        "prices": {"economy": 10, "business": 30, "first": 50}
    },
    "5": {
        "id": "mombasa-nairobi",
        "name": "Mombasa → Nairobi",
        "short": "Mombasa-Nairobi",
        "operator": "SGR Kenya",
        "distance": 472,
        "duration": "4.5h",
        "prices": {"economy": 10, "business": 30, "first": 50}
    }
}

# Exchange rates (USD to local)
EXCHANGE_RATES = {
    "ZMW": 27.50,  # Zambian Kwacha
    "TZS": 2580.00,  # Tanzanian Shilling
    "KES": 129.00,  # Kenyan Shilling
}

# Detect currency from phone number
def detect_currency(phone_number):
    if phone_number.startswith("+260") or phone_number.startswith("260"):
        return "ZMW"
    elif phone_number.startswith("+255") or phone_number.startswith("255"):
        return "TZS"
    elif phone_number.startswith("+254") or phone_number.startswith("254"):
        return "KES"
    return "USD"

# Format price in local currency
def format_price(usd_amount, currency):
    if currency == "USD":
        return f"${usd_amount}"
    rate = EXCHANGE_RATES.get(currency, 1)
    local_amount = usd_amount * rate
    symbols = {"ZMW": "K", "TZS": "TSh", "KES": "KSh"}
    symbol = symbols.get(currency, currency)
    return f"{symbol}{local_amount:,.0f}"

# Get available dates (next 7 days)
def get_available_dates():
    dates = []
    for i in range(1, 8):
        date = datetime.now() + timedelta(days=i)
        dates.append(date.strftime("%Y-%m-%d"))
    return dates

# Generate booking reference
def generate_booking_ref(phone_number):
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    hash_input = f"{phone_number}{timestamp}"
    return "AR" + hashlib.md5(hash_input.encode()).hexdigest()[:8].upper()

# Get session data
def get_session(session_id):
    return sessions.get(session_id, {})

# Set session data
def set_session(session_id, data):
    sessions[session_id] = data

# Clear session
def clear_session(session_id):
    if session_id in sessions:
        del sessions[session_id]

# Get wallet balance
def get_afc_balance(wallet_address):
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_getBalance",
            "params": [wallet_address, AFC_COIN_TYPE]
        }
        response = requests.post(SUI_RPC_URL, json=payload, timeout=10).json()
        return int(response['result']['totalBalance']) / 1_000_000_000
    except Exception:
        return 0.0

# Process payment (stub - integrate with mobile money in production)
def process_payment(phone_number, amount_usd, currency, booking_ref):
    """
    In production, integrate with:
    - MTN Mobile Money API
    - Airtel Money API
    - M-Pesa API
    - AFC blockchain payment
    """
    # Simulate payment processing
    return {
        "success": True,
        "transaction_id": f"TXN{booking_ref}",
        "amount": amount_usd,
        "currency": currency
    }

# Create ticket in database (stub)
def create_ticket(booking_data):
    """
    In production, save to database and mint NFT ticket
    """
    return {
        "ticket_id": booking_data["booking_ref"],
        "status": "confirmed"
    }

# Send SMS confirmation
def send_sms_confirmation(phone_number, booking_data):
    """
    In production, use Africa's Talking or Twilio SMS API
    """
    message = (
        f"Africa Railways Booking Confirmed!\n"
        f"Ref: {booking_data['booking_ref']}\n"
        f"Route: {booking_data['route_name']}\n"
        f"Date: {booking_data['date']}\n"
        f"Class: {booking_data['class']}\n"
        f"Show this SMS at the station."
    )
    # TODO: Send actual SMS
    print(f"SMS to {phone_number}: {message}")
    return True


@app.route("/ussd", methods=['POST', 'GET'])
def ussd_handler():
    """
    Main USSD handler
    Africa's Talking sends: sessionId, phoneNumber, text
    """
    session_id = request.values.get("sessionId", "")
    phone_number = request.values.get("phoneNumber", "")
    text = request.values.get("text", "")
    
    # Detect user's currency
    currency = detect_currency(phone_number)
    
    # Parse input levels
    inputs = text.split("*") if text else []
    level = len(inputs)
    
    # Get/create session
    session = get_session(session_id)
    if not session:
        session = {"phone": phone_number, "currency": currency, "step": "main"}
        set_session(session_id, session)
    
    response = ""
    
    # ============ MAIN MENU ============
    if text == "":
        response = "CON 🚂 Africa Railways\n"
        response += "1. Book Ticket\n"
        response += "2. Check Booking\n"
        response += "3. AFC Balance\n"
        response += "4. Help"
    
    # ============ BOOK TICKET FLOW ============
    elif text == "1":
        # Show routes
        response = "CON Select Route:\n"
        for key, route in ROUTES.items():
            price = format_price(route["prices"]["economy"], currency)
            response += f"{key}. {route['short']} ({price})\n"
    
    elif text.startswith("1*") and level == 2:
        # Route selected, show dates
        route_key = inputs[1]
        if route_key in ROUTES:
            session["route"] = route_key
            set_session(session_id, session)
            
            dates = get_available_dates()
            response = "CON Select Date:\n"
            for i, date in enumerate(dates[:5], 1):
                day_name = datetime.strptime(date, "%Y-%m-%d").strftime("%a %d %b")
                response += f"{i}. {day_name}\n"
        else:
            response = "END Invalid route. Please try again."
    
    elif text.startswith("1*") and level == 3:
        # Date selected, show classes
        route_key = session.get("route")
        date_idx = int(inputs[2]) - 1
        dates = get_available_dates()
        
        if route_key and 0 <= date_idx < len(dates):
            session["date"] = dates[date_idx]
            set_session(session_id, session)
            
            route = ROUTES[route_key]
            response = "CON Select Class:\n"
            for i, (cls, price) in enumerate(route["prices"].items(), 1):
                formatted_price = format_price(price, currency)
                response += f"{i}. {cls.title()} - {formatted_price}\n"
        else:
            response = "END Invalid selection. Please try again."
    
    elif text.startswith("1*") and level == 4:
        # Class selected, show confirmation
        route_key = session.get("route")
        date = session.get("date")
        class_idx = int(inputs[3]) - 1
        
        if route_key and date:
            route = ROUTES[route_key]
            classes = list(route["prices"].keys())
            
            if 0 <= class_idx < len(classes):
                selected_class = classes[class_idx]
                price_usd = route["prices"][selected_class]
                
                session["class"] = selected_class
                session["price_usd"] = price_usd
                set_session(session_id, session)
                
                formatted_price = format_price(price_usd, currency)
                formatted_date = datetime.strptime(date, "%Y-%m-%d").strftime("%a %d %b")
                
                response = "CON Confirm Booking:\n"
                response += f"Route: {route['short']}\n"
                response += f"Date: {formatted_date}\n"
                response += f"Class: {selected_class.title()}\n"
                response += f"Price: {formatted_price}\n\n"
                response += "1. Confirm & Pay\n"
                response += "2. Cancel"
            else:
                response = "END Invalid class. Please try again."
        else:
            response = "END Session expired. Please start again."
    
    elif text.startswith("1*") and level == 5:
        # Confirmation response
        confirm = inputs[4]
        
        if confirm == "1":
            # Process booking
            route_key = session.get("route")
            date = session.get("date")
            selected_class = session.get("class")
            price_usd = session.get("price_usd")
            
            if all([route_key, date, selected_class, price_usd]):
                route = ROUTES[route_key]
                booking_ref = generate_booking_ref(phone_number)
                
                # Process payment
                payment = process_payment(phone_number, price_usd, currency, booking_ref)
                
                if payment["success"]:
                    # Create ticket
                    booking_data = {
                        "booking_ref": booking_ref,
                        "phone": phone_number,
                        "route_id": route["id"],
                        "route_name": route["name"],
                        "date": date,
                        "class": selected_class,
                        "price_usd": price_usd,
                        "currency": currency,
                        "status": "confirmed"
                    }
                    
                    create_ticket(booking_data)
                    send_sms_confirmation(phone_number, booking_data)
                    
                    formatted_price = format_price(price_usd, currency)
                    
                    response = "END ✅ Booking Confirmed!\n\n"
                    response += f"Ref: {booking_ref}\n"
                    response += f"Route: {route['short']}\n"
                    response += f"Date: {date}\n"
                    response += f"Class: {selected_class.title()}\n"
                    response += f"Paid: {formatted_price}\n\n"
                    response += "SMS confirmation sent.\n"
                    response += f"WhatsApp: {WHATSAPP_NUMBER}"
                    
                    clear_session(session_id)
                else:
                    response = "END ❌ Payment failed. Please try again or contact support.\n"
                    response += f"WhatsApp: {WHATSAPP_NUMBER}"
            else:
                response = "END Session expired. Please start again."
        
        elif confirm == "2":
            clear_session(session_id)
            response = "END Booking cancelled."
        else:
            response = "END Invalid option."
    
    # ============ CHECK BOOKING ============
    elif text == "2":
        response = "CON Enter Booking Reference:\n"
        response += "(e.g., AR12345678)"
    
    elif text.startswith("2*") and level == 2:
        booking_ref = inputs[1].upper()
        # In production, lookup from database
        if booking_ref.startswith("AR") and len(booking_ref) == 10:
            response = f"END Booking {booking_ref}:\n"
            response += "Status: Confirmed ✅\n"
            response += "Route: Kapiri-Dar\n"
            response += "Date: 2026-01-15\n"
            response += "Class: Economy\n\n"
            response += "Show this at the station."
        else:
            response = "END Booking not found.\n"
            response += f"Need help? WhatsApp: {WHATSAPP_NUMBER}"
    
    # ============ AFC BALANCE ============
    elif text == "3":
        # In production, lookup wallet from phone number
        wallet = "0x4284dee31121675fce54b211eddf0eb786ed5d6880b8ec728d2c0a3cc104e3c8"
        balance = get_afc_balance(wallet)
        
        response = f"END AFC Balance: {balance:,.2f} AFC\n"
        response += f"(≈ {format_price(balance, currency)})\n\n"
        response += "Top up via Mobile Money or\n"
        response += f"WhatsApp: {WHATSAPP_NUMBER}"
    
    # ============ HELP ============
    elif text == "4":
        response = "END Africa Railways Help\n\n"
        response += "📞 WhatsApp Support:\n"
        response += f"{WHATSAPP_NUMBER}\n\n"
        response += "📧 Email:\n"
        response += "support@africarailways.com\n\n"
        response += "🌐 Website:\n"
        response += "africarailways.com"
    
    # ============ INVALID ============
    else:
        response = "END Invalid option.\n"
        response += "Dial *123*RAIL# to start again."
    
    return make_response(response, 200, {"Content-Type": "text/plain"})


@app.route("/ussd/health", methods=['GET'])
def health_check():
    return {"status": "ok", "service": "Africa Railways USSD Booking"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
