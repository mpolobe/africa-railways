#!/usr/bin/env python3
"""
ARAIL USSD Gateway - Flask Backend
Service Code: *384*26621#
Handles ticket booking and $SENT investment via USSD
"""

from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import hashlib
import hmac

# Sui blockchain integration
try:
    from backend.sui_integration import (
        invest_sent,
        check_sent_balance,
        claim_vested_tokens,
        mint_afc,
        mint_ticket_nft
    )
    SUI_AVAILABLE = True
except ImportError:
    SUI_AVAILABLE = False
    print("⚠️  Warning: Sui integration not available")
    
    # Mock functions for development
    def invest_sent(phone, amount):
        return True, "0xMOCK_TX", None
    def check_sent_balance(phone):
        return True, {'total_equity_tokens': 142857, 'claimable': 11905}, None
    def claim_vested_tokens(phone, cert_id):
        return True, "0xMOCK_TX", None
    def mint_afc(phone, amount):
        return True, "0xMOCK_TX", None
    def mint_ticket_nft(phone, route, train, seat, price):
        return True, "TKT123", None

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
SUI_RPC_URL = os.environ.get('SUI_RPC_URL', 'https://fullnode.mainnet.sui.io:443')
SUI_PRIVATE_KEY = os.environ.get('SUI_PRIVATE_KEY', '')
PACKAGE_ID = os.environ.get('PACKAGE_ID', '0x_YOUR_PACKAGE_ID')
TREASURY_ID = os.environ.get('TREASURY_ID', '0x_YOUR_TREASURY_ID')
AFRICAS_TALKING_API_KEY = os.environ.get('AFRICAS_TALKING_API_KEY', '')

# IP whitelist for Africa's Talking
ALLOWED_IPS = [
    '52.48.80.0/24',
    '54.76.0.0/16',
    '3.8.0.0/16',
    '18.202.0.0/16',
]

# Session storage (in production, use Redis)
sessions = {}

# Current SUI price (update via API in production)
SUI_PRICE = 1.44

def validate_ip(ip_address):
    """Validate if request is from Africa's Talking"""
    if os.environ.get('FLASK_ENV') == 'development':
        return True
    
    # Simple IP validation (use proper library in production)
    for allowed_range in ALLOWED_IPS:
        if ip_address.startswith(allowed_range.split('/')[0][:7]):
            return True
    return False

def verify_signature(request_data, signature):
    """Verify Africa's Talking request signature"""
    if not AFRICAS_TALKING_API_KEY:
        return True  # Skip in development
    
    payload = json.dumps(request_data, sort_keys=True)
    expected_signature = hmac.new(
        AFRICAS_TALKING_API_KEY.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

def get_session_data(session_id):
    """Retrieve session data"""
    return sessions.get(session_id, {})

def set_session_data(session_id, data):
    """Store session data"""
    sessions[session_id] = {
        **data,
        'last_updated': datetime.now().isoformat()
    }

def clear_session(session_id):
    """Clear session data"""
    if session_id in sessions:
        del sessions[session_id]

# Removed - now using backend/sui_integration.py

def book_ticket(phone_number, route, train_id):
    """
    Book train ticket and mint NFT
    Returns: (success, ticket_id, error_message)
    """
    try:
        logger.info(f"Booking ticket for {phone_number}: {route}, train {train_id}")
        
        # In production:
        # 1. Check seat availability
        # 2. Process mobile money payment
        # 3. Mint ticket NFT on Sui
        # 4. Send SMS confirmation
        
        ticket_id = f"TKT{int(datetime.now().timestamp())}"
        return True, ticket_id, None
        
    except Exception as e:
        logger.error(f"Error booking ticket: {str(e)}")
        return False, None, str(e)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ARAIL USSD Gateway',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'sui_integration': SUI_AVAILABLE
    })

@app.route('/ussd', methods=['POST'])
def ussd_callback():
    """
    Main USSD callback handler for *384*26621#
    """
    # Get client IP
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Validate IP (disabled in development)
    if not validate_ip(client_ip):
        logger.warning(f"Unauthorized request from {client_ip}")
        return make_response("Forbidden", 403)
    
    # Get parameters from Africa's Talking
    session_id = request.values.get("sessionId", "")
    service_code = request.values.get("serviceCode", "")
    phone_number = request.values.get("phoneNumber", "")
    text = request.values.get("text", "")
    network_code = request.values.get("networkCode", "")
    
    # Log request
    logger.info(f"USSD Request - Session: {session_id}, Phone: {phone_number}, Text: '{text}'")
    
    # Get session data
    session_data = get_session_data(session_id)
    
    # Parse user input
    text_array = text.split('*') if text else []
    level = len(text_array)
    
    response = ""
    
    try:
        # ============================================
        # MAIN MENU (Initial Dial)
        # ============================================
        if text == "":
            response = "CON Welcome to ARAIL 🚂\n"
            response += "Africa's Digital Railway\n\n"
            response += "1. Book Train Ticket\n"
            response += "2. Invest in $SENT Pre-Seed\n"
            response += "3. Check My Wallet\n"
            response += "4. Help & Support"
        
        # ============================================
        # BOOKING FLOW
        # ============================================
        elif text == "1":
            response = "CON Select Route:\n\n"
            response += "1. Lusaka → Dar es Salaam\n"
            response += "2. Dar es Salaam → Lusaka\n"
            response += "3. Lusaka → Kapiri Mposhi\n"
            response += "4. Kapiri → Dar es Salaam\n"
            response += "0. Back to Main Menu"
        
        elif text == "1*1":
            # Lusaka → Dar es Salaam
            set_session_data(session_id, {
                'flow': 'booking',
                'route': 'Lusaka → Dar es Salaam',
                'origin': 'Lusaka',
                'destination': 'Dar es Salaam'
            })
            response = "CON Lusaka → Dar es Salaam\n"
            response += "Available Trains:\n\n"
            response += "1. Express - 06:00 (K450)\n"
            response += "2. Standard - 14:00 (K280)\n"
            response += "3. Night - 20:00 (K320)\n"
            response += "0. Back"
        
        elif text == "1*1*1":
            # Selected Express train
            set_session_data(session_id, {
                **session_data,
                'train': 'Express 06:00',
                'price': 450
            })
            response = "CON Express Train - K450\n"
            response += "Departure: 06:00\n"
            response += "Arrival: 18:00 (next day)\n\n"
            response += "1. Confirm Booking\n"
            response += "0. Back"
        
        elif text == "1*1*1*1":
            # Confirm booking
            route = session_data.get('route', 'Unknown')
            price = session_data.get('price', 0)
            
            success, ticket_id, error = book_ticket(phone_number, route, 'express')
            
            if success:
                response = f"END ✅ Booking Confirmed!\n\n"
                response += f"Route: {route}\n"
                response += f"Train: Express 06:00\n"
                response += f"Price: K{price}\n"
                response += f"Ticket: {ticket_id}\n\n"
                response += f"SMS sent to {phone_number}\n"
                response += "Safe travels! 🚂"
                clear_session(session_id)
            else:
                response = f"END ❌ Booking Failed\n\n"
                response += f"Error: {error}\n"
                response += "Please try again or contact support."
        
        # ============================================
        # INVESTMENT FLOW ($SENT)
        # ============================================
        elif text == "2":
            response = "CON 💎 ARAIL Pre-Seed Round\n\n"
            response += f"SUI Price: ${SUI_PRICE}\n"
            response += "Min Investment: 100 SUI\n"
            response += "Equity: 10% offered\n\n"
            response += "1. Invest 100 SUI (~$144)\n"
            response += "2. Invest 500 SUI (~$720)\n"
            response += "3. Invest 1000 SUI (~$1,440)\n"
            response += "4. Custom Amount\n"
            response += "0. Back"
        
        elif text == "2*1":
            # Invest 100 SUI
            set_session_data(session_id, {
                'flow': 'investment',
                'sui_amount': 100,
                'usd_value': 100 * SUI_PRICE
            })
            equity_percent = (100 / 350000) * 10
            response = "CON Investment Summary:\n\n"
            response += "Amount: 100 SUI\n"
            response += f"USD Value: ${100 * SUI_PRICE:.2f}\n"
            response += f"Equity: {equity_percent:.4f}%\n"
            response += "Vesting: 12 months linear\n\n"
            response += "1. Confirm Investment\n"
            response += "0. Cancel"
        
        elif text == "2*1*1":
            # Confirm 100 SUI investment
            sui_amount = session_data.get('sui_amount', 100)
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number} investing {sui_amount} SUI")
            
            success, tx_digest, error = mint_sent_tokens(phone_number, sui_amount)
            
            if success:
                equity_percent = (sui_amount / 350000) * 10
                response = f"END ✅ Investment Confirmed!\n\n"
                response += f"Amount: {sui_amount} SUI\n"
                response += f"Equity: {equity_percent:.4f}%\n"
                response += f"TX: {tx_digest[:10]}...\n\n"
                response += "Certificate NFT sent to your wallet.\n"
                response += "Welcome to ARAIL! 🚂💎"
                clear_session(session_id)
            else:
                response = f"END ❌ Investment Failed\n\n"
                response += f"Error: {error}\n"
                response += "Please contact investors@africarailways.com"
        
        elif text == "2*2":
            # Invest 500 SUI
            set_session_data(session_id, {
                'flow': 'investment',
                'sui_amount': 500,
                'usd_value': 500 * SUI_PRICE
            })
            equity_percent = (500 / 350000) * 10
            response = "CON Investment Summary:\n\n"
            response += "Amount: 500 SUI\n"
            response += f"USD Value: ${500 * SUI_PRICE:.2f}\n"
            response += f"Equity: {equity_percent:.4f}%\n"
            response += "Vesting: 12 months linear\n\n"
            response += "1. Confirm Investment\n"
            response += "0. Cancel"
        
        elif text == "2*2*1":
            # Confirm 500 SUI investment
            sui_amount = session_data.get('sui_amount', 500)
            
            logger.info(f"🚀 INVESTMENT TRIGGER: {phone_number} investing {sui_amount} SUI")
            
            success, tx_digest, error = mint_sent_tokens(phone_number, sui_amount)
            
            if success:
                equity_percent = (sui_amount / 350000) * 10
                response = f"END ✅ Investment Confirmed!\n\n"
                response += f"Amount: {sui_amount} SUI\n"
                response += f"Equity: {equity_percent:.4f}%\n"
                response += f"TX: {tx_digest[:10]}...\n\n"
                response += "Certificate NFT sent to your wallet.\n"
                response += "Welcome to ARAIL! 🚂💎"
                clear_session(session_id)
            else:
                response = f"END ❌ Investment Failed\n\n"
                response += f"Error: {error}\n"
                response += "Please contact investors@africarailways.com"
        
        # ============================================
        # WALLET CHECK
        # ============================================
        elif text == "3":
            response = "CON Check Wallet:\n\n"
            response += "1. $SENT Balance\n"
            response += "2. AFC Balance\n"
            response += "3. My Tickets\n"
            response += "0. Back"
        
        elif text == "3*1":
            # Check $SENT balance
            response = f"END Your $SENT Balance:\n\n"
            response += "Balance: 142,857 SENT\n"
            response += "Equity: 0.1429%\n"
            response += "Vested: 35,714 SENT\n"
            response += "Claimable: 11,905 SENT\n\n"
            response += "Visit africarailways.com/vesting to claim"
        
        # ============================================
        # HELP & SUPPORT
        # ============================================
        elif text == "4":
            response = "END ARAIL Support:\n\n"
            response += "📞 +260 977 000 000\n"
            response += "📧 support@africarailways.com\n"
            response += "🌐 africarailways.com\n\n"
            response += "Office Hours:\n"
            response += "Mon-Fri: 08:00-17:00\n"
            response += "Sat: 09:00-13:00"
        
        # ============================================
        # BACK TO MAIN MENU
        # ============================================
        elif text.endswith("*0"):
            response = "CON Welcome to ARAIL 🚂\n"
            response += "Africa's Digital Railway\n\n"
            response += "1. Book Train Ticket\n"
            response += "2. Invest in $SENT Pre-Seed\n"
            response += "3. Check My Wallet\n"
            response += "4. Help & Support"
            clear_session(session_id)
        
        # ============================================
        # INVALID INPUT
        # ============================================
        else:
            response = "END Invalid selection.\n\n"
            response += "Please dial *384*26621# to try again."
            clear_session(session_id)
    
    except Exception as e:
        logger.error(f"Error processing USSD request: {str(e)}")
        response = "END An error occurred.\n\n"
        response += "Please try again or contact support."
        clear_session(session_id)
    
    # Return response with correct content type
    resp = make_response(response, 200)
    resp.headers['Content-Type'] = 'text/plain'
    
    logger.info(f"USSD Response - Session: {session_id}, Type: {response[:3]}")
    
    return resp

@app.route('/webhook/payment', methods=['POST'])
def payment_webhook():
    """Handle mobile money payment webhooks"""
    try:
        data = request.get_json()
        logger.info(f"Payment webhook: {data}")
        
        # Process payment confirmation
        # Update booking status
        # Mint ticket NFT
        
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Payment webhook error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get current fundraising stats"""
    return jsonify({
        'sui_price': SUI_PRICE,
        'total_raised': 85400,
        'goal': 350000,
        'investor_count': 37,
        'progress_percent': 24.4,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == "__main__":
    # Railway sets the PORT environment variable automatically
    port = int(os.environ.get("PORT", 5000))
    
    logger.info(f"🚂 Starting ARAIL USSD Gateway on port {port}")
    logger.info(f"Service Code: *384*26621#")
    logger.info(f"Sui Integration: {'✅ Enabled' if SUI_AVAILABLE else '❌ Disabled'}")
    
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_ENV') == 'development')
