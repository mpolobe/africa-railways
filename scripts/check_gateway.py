import os
import africastalking
from dotenv import load_dotenv

load_dotenv() # Loads your .env from the root

# Initialize the SDK
username = os.getenv("AT_USERNAME")
api_key = os.getenv("AT_API_KEY")
africastalking.initialize(username, api_key)

# Check account balance to verify connectivity
application = africastalking.Application
try:
    data = application.fetch_application_data()
    print(f"✅ Connection Successful!")
    print(f"Balance: {data['UserData']['balance']}")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
