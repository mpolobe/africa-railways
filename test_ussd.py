#!/usr/bin/env python3
"""
ARAIL USSD Testing Script
Tests the *384*26621# service code against Railway.app backend
"""

import requests
import time
from datetime import datetime

# Configuration
CALLBACK_URL = "https://africa-railways-production.up.railway.app/ussd"
SERVICE_CODE = "*384*26621#"
PHONE_NUMBER = "+260975190740"  # Test Zambian number

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def simulate_ussd_request(user_input="", session_id=None):
    """
    Simulates a POST request from Africa's Talking gateway.
    
    Args:
        user_input: "" for initial dial, "1" for first menu, "1*2" for nested menu
        session_id: Session ID to maintain state across requests
    
    Returns:
        dict: Response data including status, text, and validation results
    """
    if session_id is None:
        session_id = f"AT_Mock_{int(time.time())}"
    
    payload = {
        'sessionId': session_id,
        'serviceCode': SERVICE_CODE,
        'phoneNumber': PHONE_NUMBER,
        'text': user_input,
        'networkCode': '63902'  # MTN Zambia
    }

    print(f"\n{Colors.BOLD}Request Details:{Colors.ENDC}")
    print(f"  Session ID: {session_id}")
    print(f"  Phone: {PHONE_NUMBER}")
    print(f"  Input: '{user_input}' (Level {len(user_input.split('*')) if user_input else 0})")
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        start_time = time.time()
        response = requests.post(
            CALLBACK_URL, 
            data=payload, 
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        print(f"\n{Colors.BOLD}Response:{Colors.ENDC}")
        print(f"  Status Code: {response.status_code}")
        print(f"  Response Time: {response_time:.2f}ms")
        print(f"  Content Length: {len(response.text)} bytes")
        
        # Validate response format
        is_valid = False
        response_type = None
        
        if response.text.startswith("CON"):
            is_valid = True
            response_type = "CONTINUE"
            print_success("Valid CON response (session continues)")
        elif response.text.startswith("END"):
            is_valid = True
            response_type = "END"
            print_success("Valid END response (session terminates)")
        else:
            print_error("Invalid response format (must start with CON or END)")
        
        # Display response content
        print(f"\n{Colors.BOLD}Response Content:{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'-'*60}{Colors.ENDC}")
        print(response.text)
        print(f"{Colors.OKCYAN}{'-'*60}{Colors.ENDC}")
        
        # Performance check
        if response_time > 3000:
            print_warning(f"Slow response time: {response_time:.2f}ms (should be < 3000ms)")
        elif response_time > 1000:
            print_info(f"Acceptable response time: {response_time:.2f}ms")
        else:
            print_success(f"Fast response time: {response_time:.2f}ms")
        
        return {
            'success': response.status_code == 200 and is_valid,
            'status_code': response.status_code,
            'response_type': response_type,
            'response_text': response.text,
            'response_time': response_time,
            'session_id': session_id
        }
        
    except requests.exceptions.Timeout:
        print_error("Request timed out after 10 seconds")
        return {'success': False, 'error': 'timeout'}
    except requests.exceptions.ConnectionError:
        print_error(f"Connection error: Cannot reach {CALLBACK_URL}")
        return {'success': False, 'error': 'connection_error'}
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return {'success': False, 'error': str(e)}

def test_full_booking_flow():
    """
    Tests a complete booking flow from start to finish
    """
    print_header("FULL BOOKING FLOW TEST")
    
    session_id = f"AT_Test_{int(time.time())}"
    results = []
    
    # Step 1: Initial dial
    print_info("Step 1: Initial dial (*384*26621#)")
    result = simulate_ussd_request("", session_id)
    results.append(('Initial Menu', result['success']))
    time.sleep(1)
    
    if not result['success']:
        print_error("Initial dial failed. Aborting test.")
        return
    
    # Step 2: Select "Book Ticket" (option 1)
    print_info("\nStep 2: Select 'Book Ticket' (1)")
    result = simulate_ussd_request("1", session_id)
    results.append(('Book Ticket Menu', result['success']))
    time.sleep(1)
    
    # Step 3: Select route (Lusaka → Dar es Salaam)
    print_info("\nStep 3: Select route 'Lusaka → Dar es Salaam' (1*1)")
    result = simulate_ussd_request("1*1", session_id)
    results.append(('Route Selection', result['success']))
    time.sleep(1)
    
    # Step 4: Select train
    print_info("\nStep 4: Select train (1*1*1)")
    result = simulate_ussd_request("1*1*1", session_id)
    results.append(('Train Selection', result['success']))
    time.sleep(1)
    
    # Step 5: Select seat
    print_info("\nStep 5: Select seat (1*1*1*1)")
    result = simulate_ussd_request("1*1*1*1", session_id)
    results.append(('Seat Selection', result['success']))
    time.sleep(1)
    
    # Step 6: Confirm booking
    print_info("\nStep 6: Confirm booking (1*1*1*1*1)")
    result = simulate_ussd_request("1*1*1*1*1", session_id)
    results.append(('Booking Confirmation', result['success']))
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for step, success in results:
        if success:
            print_success(f"{step}: PASSED")
        else:
            print_error(f"{step}: FAILED")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print_success("All tests passed! 🎉")
    else:
        print_error(f"{total - passed} test(s) failed")

def test_all_menu_options():
    """
    Tests all main menu options
    """
    print_header("MENU OPTIONS TEST")
    
    menu_options = [
        ("1", "Book Ticket"),
        ("2", "View Routes"),
        ("3", "My Bookings"),
        ("4", "Check Balance"),
        ("5", "Help")
    ]
    
    results = []
    
    for option, description in menu_options:
        print_info(f"\nTesting: {description} (option {option})")
        result = simulate_ussd_request(option)
        results.append((description, result['success']))
        time.sleep(1)
    
    # Summary
    print_header("MENU TEST SUMMARY")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for option, success in results:
        if success:
            print_success(f"{option}: PASSED")
        else:
            print_error(f"{option}: FAILED")
    
    print(f"\n{Colors.BOLD}Overall: {passed}/{total} menu options working{Colors.ENDC}")

def test_invalid_inputs():
    """
    Tests error handling for invalid inputs
    """
    print_header("INVALID INPUT TEST")
    
    invalid_inputs = [
        ("99", "Non-existent menu option"),
        ("abc", "Alphabetic input"),
        ("1*99", "Invalid nested option"),
        ("", "Empty after initial (should show menu)"),
    ]
    
    for input_val, description in invalid_inputs:
        print_info(f"\nTesting: {description} ('{input_val}')")
        result = simulate_ussd_request(input_val)
        
        # For invalid inputs, we expect either:
        # 1. An error message (END)
        # 2. A redirect back to main menu (CON)
        if result['success']:
            print_success("Server handled invalid input gracefully")
        else:
            print_error("Server did not handle invalid input properly")
        
        time.sleep(1)

def test_performance():
    """
    Tests response time under load
    """
    print_header("PERFORMANCE TEST")
    
    num_requests = 10
    response_times = []
    
    print_info(f"Sending {num_requests} requests...")
    
    for i in range(num_requests):
        result = simulate_ussd_request("")
        if 'response_time' in result:
            response_times.append(result['response_time'])
        time.sleep(0.5)
    
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        
        print(f"\n{Colors.BOLD}Performance Metrics:{Colors.ENDC}")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        
        if avg_time < 1000:
            print_success("Excellent performance!")
        elif avg_time < 3000:
            print_info("Acceptable performance")
        else:
            print_warning("Performance needs improvement")

def interactive_mode():
    """
    Interactive mode for manual testing
    """
    print_header("INTERACTIVE USSD TESTING MODE")
    print_info("Type your USSD input (e.g., '1' or '1*2*3') or 'quit' to exit")
    print_info("Press Enter with no input to simulate initial dial\n")
    
    session_id = f"AT_Interactive_{int(time.time())}"
    
    while True:
        try:
            user_input = input(f"{Colors.BOLD}USSD Input > {Colors.ENDC}").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print_info("Exiting interactive mode...")
                break
            
            result = simulate_ussd_request(user_input, session_id)
            
            if not result['success']:
                print_warning("Request failed. Starting new session...")
                session_id = f"AT_Interactive_{int(time.time())}"
            
            print()  # Blank line for readability
            
        except KeyboardInterrupt:
            print_info("\nExiting interactive mode...")
            break
        except Exception as e:
            print_error(f"Error: {str(e)}")

def main():
    """
    Main test runner
    """
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          ARAIL USSD Testing Suite v1.0.0                  ║")
    print("║          Service Code: *384*26621#                        ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")
    
    print(f"{Colors.BOLD}Select Test Mode:{Colors.ENDC}")
    print("1. Quick Test (Initial dial only)")
    print("2. Full Booking Flow")
    print("3. All Menu Options")
    print("4. Invalid Input Handling")
    print("5. Performance Test")
    print("6. Interactive Mode")
    print("7. Run All Tests")
    print("0. Exit")
    
    try:
        choice = input(f"\n{Colors.BOLD}Enter choice (0-7): {Colors.ENDC}").strip()
        
        if choice == '1':
            print_header("QUICK TEST")
            simulate_ussd_request("")
        elif choice == '2':
            test_full_booking_flow()
        elif choice == '3':
            test_all_menu_options()
        elif choice == '4':
            test_invalid_inputs()
        elif choice == '5':
            test_performance()
        elif choice == '6':
            interactive_mode()
        elif choice == '7':
            print_info("Running all tests...")
            simulate_ussd_request("")
            test_all_menu_options()
            test_invalid_inputs()
            test_full_booking_flow()
            test_performance()
        elif choice == '0':
            print_info("Exiting...")
        else:
            print_error("Invalid choice")
    
    except KeyboardInterrupt:
        print_info("\nTest interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()
