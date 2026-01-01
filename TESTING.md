# ARAIL Testing Documentation

## Overview

This document describes the testing infrastructure for the ARAIL USSD Gateway and investment platform. Our test suite covers security features, integration flows, and end-to-end scenarios.

## Test Files

### 1. `test_investment_integration.py`
Comprehensive integration tests for the investment flow and security features.

**Test Categories:**
- Security tests (IP validation, rate limiting, session management)
- Investment flow tests (menu navigation, confirmations, error handling)
- Wallet functionality tests
- Input validation and sanitization

### 2. `test_ussd.py`
End-to-end testing script for the deployed USSD service.

**Features:**
- Simulates actual Africa's Talking USSD requests
- Tests complete user flows
- Performance testing
- Interactive testing mode

## Running Tests

### Prerequisites

Install test dependencies:
```bash
pip install -r requirements.txt
```

### Run Integration Tests

Run all integration tests:
```bash
pytest test_investment_integration.py -v
```

Run specific test class:
```bash
pytest test_investment_integration.py::TestSecurity -v
```

Run with coverage:
```bash
pytest test_investment_integration.py --cov=app --cov-report=html
```

### Run End-to-End Tests

Test against deployed service:
```bash
python test_ussd.py
```

Interactive testing mode:
```bash
python test_ussd.py
# Select option 6 for interactive mode
```

## Test Coverage

### Security Tests

#### IP Validation (`test_ip_validation_*`)
- ✅ Validates allowed Africa's Talking IP ranges
- ✅ Blocks unauthorized IPs
- ✅ Handles invalid IP formats
- **Security Benefit:** Prevents unauthorized access to USSD endpoint

#### Rate Limiting (`test_rate_limiting_*`)
- ✅ Allows normal traffic (up to 10 requests per minute)
- ✅ Blocks excessive requests
- ✅ Rate limits per phone number
- **Security Benefit:** Prevents DoS attacks and abuse

#### Session Management (`test_session_cleanup`)
- ✅ Removes expired sessions (older than 1 hour)
- ✅ Preserves recent sessions
- **Security Benefit:** Prevents memory leaks and session hijacking

#### Socket Timeout (`test_socket_timeout_*`)
- ✅ Sets timeout correctly
- ✅ Restores timeout after operation
- ✅ Handles exceptions properly
- **Security Benefit:** Prevents hanging connections

### Investment Flow Tests

#### Menu Navigation
- `test_ussd_initial_menu`: Tests initial USSD menu display
- `test_investment_menu`: Tests investment options menu
- `test_investment_100_sui_summary`: Tests investment summary display

#### Investment Execution
- `test_investment_confirmation_success`: Tests successful investment
- `test_investment_confirmation_failure`: Tests failed investment handling
- `test_investment_timeout_handling`: Tests timeout scenarios
- **Coverage:** All investment paths (100 SUI, 500 SUI, 1000 SUI)

#### Error Handling
- `test_invalid_phone_number`: Tests phone number validation
- `test_rate_limit_exceeded`: Tests rate limiting enforcement
- `test_input_sanitization`: Tests XSS prevention
- **Coverage:** All error scenarios with graceful degradation

### Wallet Tests

- `test_wallet_check_with_investment`: Tests wallet display with investment
- `test_wallet_check_no_investment`: Tests wallet display without investment
- **Coverage:** Token vesting, claiming, and balance checks

## Test Environment Setup

### Development Environment

Set environment variable for local testing:
```bash
export FLASK_ENV=development
```

This disables IP validation and uses mock implementations for:
- Sui blockchain integration
- SMS notifications

### Production Testing

Test against production:
1. Configure `CALLBACK_URL` in `test_ussd.py`
2. Run end-to-end tests
3. Monitor logs for issues

## Continuous Integration

### GitHub Actions

The CI pipeline (`deploy.yml`) includes:
1. **Test job**: Runs Go backend tests
2. **Lint job**: Code quality checks
3. **Security scan**: Vulnerability scanning with Trivy
4. **Deploy jobs**: Deploys to preview/production environments

### Adding Python Tests to CI

Add to `.github/workflows/deploy.yml`:

```yaml
test-python:
  name: Test Python Backend
  runs-on: ubuntu-latest
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest test_investment_integration.py -v --cov=app
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: always()
```

## Security Testing

### Critical Security Features Tested

1. **Input Validation**
   - Phone number format validation
   - SUI amount range validation
   - Input sanitization (removes special characters)
   - Max length enforcement

2. **Rate Limiting**
   - Per-phone number limits
   - Time-window based (1 minute)
   - Configurable thresholds

3. **IP Whitelisting**
   - CIDR range matching
   - Africa's Talking IP ranges only
   - Proper IPv4 address parsing

4. **Session Security**
   - Automatic expiration (1 hour)
   - Periodic cleanup
   - Memory leak prevention

5. **Timeout Protection**
   - Socket timeout for blockchain calls (30s)
   - Context manager for proper cleanup
   - Graceful error handling

## Test Data

### Test Phone Numbers

Valid test numbers:
- `+260975190740` (Zambia - MTN)
- `+254712345678` (Kenya)
- `+255712345678` (Tanzania)

Invalid test numbers:
- `123` (too short)
- `invalid` (non-numeric)
- `+1234567890123456` (too long)

### Test Investment Amounts

Valid amounts:
- 100 SUI (minimum)
- 500 SUI
- 1000 SUI
- Custom amounts (100-10000 range)

Invalid amounts:
- 0 SUI (below minimum)
- 50 SUI (below minimum)
- 2000000 SUI (above maximum)

## Performance Benchmarks

### Response Time Targets

- USSD menu navigation: < 500ms
- Investment confirmation: < 3000ms
- Wallet check: < 1000ms

### Load Testing

Run performance tests:
```bash
python test_ussd.py
# Select option 5 for performance test
```

**Target Metrics:**
- 10 concurrent users
- Average response time: < 1000ms
- 99th percentile: < 3000ms

## Troubleshooting

### Common Issues

#### Tests fail with "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

#### Tests fail with connection errors
- Check `CALLBACK_URL` in `test_ussd.py`
- Verify service is running
- Check firewall/network settings

#### Rate limiting tests intermittent
- Clear rate limit storage between test runs
- Use `@pytest.fixture(autouse=True)` for cleanup

#### Mock imports fail
- Ensure `sui_logic.py` and `notifications.py` exist
- Check import paths

## Best Practices

### Writing New Tests

1. **Use fixtures** for setup/teardown
2. **Mock external dependencies** (blockchain, SMS)
3. **Test both success and failure paths**
4. **Use descriptive test names**
5. **Add docstrings** explaining what's tested

Example:
```python
def test_investment_with_invalid_amount(self, client):
    """Test investment rejects invalid amount"""
    response = client.post('/ussd', data={
        'sessionId': 'test_session',
        'phoneNumber': '+260975190740',
        'text': '2*4*0',  # 0 SUI
    })
    
    assert response.status_code == 200
    assert b'Error' in response.data
```

### Test Organization

- Group related tests in classes
- Use clear, hierarchical structure
- One assertion per logical check
- Keep tests independent

### Coverage Goals

- **Critical paths:** 100% coverage
- **Overall code:** > 80% coverage
- **Security functions:** 100% coverage

## Continuous Testing

### Pre-commit Hooks

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
pytest test_investment_integration.py --tb=short
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi
```

### Automated Testing Schedule

- **On every commit:** Run fast unit tests
- **On PR creation:** Run full integration suite
- **Daily:** Run end-to-end tests against staging
- **Weekly:** Run load and security tests

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [Flask testing guide](https://flask.palletsprojects.com/en/3.0.x/testing/)
- [Africa's Talking USSD docs](https://developers.africastalking.com/docs/ussd)

## Support

For testing issues or questions:
- Email: support@africarailways.com
- GitHub Issues: [africa-railways/issues](https://github.com/mpolobe/africa-railways/issues)
- Documentation: See `TESTING_QUICKSTART.md`
