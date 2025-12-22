package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/tech-kenya/africastalkingsms"
	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
)

// SMSConfig holds configuration for SMS providers
type SMSConfig struct {
	// Africa's Talking
	ATUsername string
	ATApiKey   string
	ATSenderID string

	// Twilio
	TwilioAccountSID string
	TwilioAuthToken  string
	TwilioFromNumber string
}

// LoadSMSConfig loads SMS configuration from environment variables
func LoadSMSConfig() *SMSConfig {
	return &SMSConfig{
		ATUsername:       os.Getenv("AT_USERNAME"),
		ATApiKey:         os.Getenv("AT_API_KEY"),
		ATSenderID:       os.Getenv("AT_SENDER_ID"),
		TwilioAccountSID: os.Getenv("TWILIO_ACCOUNT_SID"),
		TwilioAuthToken:  os.Getenv("TWILIO_AUTH_TOKEN"),
		TwilioFromNumber: os.Getenv("TWILIO_FROM_NUMBER"),
	}
}

// sendOnboardingSMS sends an OTP activation code with fallback logic
// Tries Africa's Talking first (cheaper/local), falls back to Twilio if it fails
func sendOnboardingSMS(phoneNumber string, otp string) error {
	message := fmt.Sprintf("Welcome to Sovereign Hub! Your Africoin Activation Code is: %s", otp)

	// 1. Try Africa's Talking (Primary for Africa)
	atClient := africastalkingsms.NewSMSClient(
		os.Getenv("AT_API_KEY"),
		os.Getenv("AT_USERNAME"), // Use 'sandbox' for testing
		"SOVEREIGN",               // Your Alphanumeric Sender ID
		"false",                   // Set to 'true' if using sandbox
	)

	_, err := atClient.SendSMS(phoneNumber, message)
	if err == nil {
		log.Printf("✅ OTP sent via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
		return nil // Success via AT
	}

	log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)

	// 2. Fallback to Twilio (Global/Reliable)
	client := twilio.NewRestClient()
	params := &openapi.CreateMessageParams{}
	params.SetTo(phoneNumber)
	params.SetFrom(os.Getenv("TWILIO_NUMBER"))
	params.SetBody(message)

	_, err = client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("both SMS providers failed: %w", err)
	}

	log.Printf("✅ OTP sent via Twilio to %s", maskPhoneNumber(phoneNumber))
	return nil
}

// SendWelcomeSMS sends a welcome SMS with fallback logic
// Tries Africa's Talking first (cheaper/local), falls back to Twilio if it fails
func SendWelcomeSMS(phoneNumber, userName string) error {
	config := LoadSMSConfig()

	message := fmt.Sprintf(
		"🚂 Welcome to Africa Railways, %s!\n"+
			"Your sovereign wallet is ready with 1,250 AFRC.\n"+
			"Book your first ticket today!",
		userName,
	)

	// Step 1: Try Africa's Talking first (preferred for African numbers)
	if isAfricanNumber(phoneNumber) && config.ATApiKey != "" {
		log.Printf("📱 Attempting SMS via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
		err := sendViaAfricasTalking(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ SMS sent successfully via Africa's Talking")
			return nil
		}
		log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)
	}

	// Step 2: Fallback to Twilio
	if config.TwilioAccountSID != "" {
		log.Printf("📱 Attempting SMS via Twilio to %s", maskPhoneNumber(phoneNumber))
		err := sendViaTwilio(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ SMS sent successfully via Twilio")
			return nil
		}
		log.Printf("❌ Twilio also failed: %v", err)
		return fmt.Errorf("both SMS providers failed: %w", err)
	}

	return fmt.Errorf("no SMS provider configured")
}

// SendTicketConfirmationSMS sends a ticket purchase confirmation with fallback
func SendTicketConfirmationSMS(phoneNumber, route string, amount int) error {
	config := LoadSMSConfig()

	message := fmt.Sprintf(
		"🎟️ Africa Railways Ticket Confirmed!\n"+
			"Route: %s\n"+
			"Amount: %d AFRC\n"+
			"Thank you for traveling with us!",
		route, amount,
	)

	// Try Africa's Talking first for African numbers
	if isAfricanNumber(phoneNumber) && config.ATApiKey != "" {
		log.Printf("📱 Sending ticket confirmation via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
		err := sendViaAfricasTalking(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Ticket confirmation sent via Africa's Talking")
			return nil
		}
		log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)
	}

	// Fallback to Twilio
	if config.TwilioAccountSID != "" {
		log.Printf("📱 Sending ticket confirmation via Twilio to %s", maskPhoneNumber(phoneNumber))
		err := sendViaTwilio(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Ticket confirmation sent via Twilio")
			return nil
		}
		log.Printf("❌ Twilio also failed: %v", err)
		return fmt.Errorf("both SMS providers failed: %w", err)
	}

	return fmt.Errorf("no SMS provider configured")
}

// SendWalletTopUpSMS sends a wallet top-up confirmation with fallback
func SendWalletTopUpSMS(phoneNumber string, amount, newBalance int) error {
	config := LoadSMSConfig()

	message := fmt.Sprintf(
		"💳 Wallet Top-Up Successful!\n"+
			"Amount: +%d AFRC\n"+
			"New Balance: %d AFRC\n"+
			"Africa Railways",
		amount, newBalance,
	)

	// Try Africa's Talking first for African numbers
	if isAfricanNumber(phoneNumber) && config.ATApiKey != "" {
		log.Printf("📱 Sending top-up confirmation via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
		err := sendViaAfricasTalking(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Top-up confirmation sent via Africa's Talking")
			return nil
		}
		log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)
	}

	// Fallback to Twilio
	if config.TwilioAccountSID != "" {
		log.Printf("📱 Sending top-up confirmation via Twilio to %s", maskPhoneNumber(phoneNumber))
		err := sendViaTwilio(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Top-up confirmation sent via Twilio")
			return nil
		}
		log.Printf("❌ Twilio also failed: %v", err)
		return fmt.Errorf("both SMS providers failed: %w", err)
	}

	return fmt.Errorf("no SMS provider configured")
}

// SendLowBalanceAlert sends a low balance warning with fallback
func SendLowBalanceAlert(phoneNumber string, balance int) error {
	config := LoadSMSConfig()

	message := fmt.Sprintf(
		"⚠️ Low Balance Alert!\n"+
			"Current Balance: %d AFRC\n"+
			"Top up now to continue booking tickets.\n"+
			"Africa Railways",
		balance,
	)

	// Try Africa's Talking first for African numbers
	if isAfricanNumber(phoneNumber) && config.ATApiKey != "" {
		log.Printf("📱 Sending low balance alert via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
		err := sendViaAfricasTalking(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Low balance alert sent via Africa's Talking")
			return nil
		}
		log.Printf("⚠️  Africa's Talking failed: %v, trying Twilio...", err)
	}

	// Fallback to Twilio
	if config.TwilioAccountSID != "" {
		log.Printf("📱 Sending low balance alert via Twilio to %s", maskPhoneNumber(phoneNumber))
		err := sendViaTwilio(phoneNumber, message, config)
		if err == nil {
			log.Printf("✅ Low balance alert sent via Twilio")
			return nil
		}
		log.Printf("❌ Twilio also failed: %v", err)
		return fmt.Errorf("both SMS providers failed: %w", err)
	}

	return fmt.Errorf("no SMS provider configured")
}

// sendViaAfricasTalking sends SMS using Africa's Talking API
func sendViaAfricasTalking(phoneNumber, message string, config *SMSConfig) error {
	// Initialize Africa's Talking client
	atClient := africastalkingsms.NewSMSClient(
		config.ATApiKey,
		config.ATUsername,
		config.ATSenderID,
		"false", // Set to 'true' if using sandbox
	)

	// Send SMS
	_, err := atClient.SendSMS(phoneNumber, message)
	if err != nil {
		return fmt.Errorf("Africa's Talking API error: %w", err)
	}

	log.Printf("✅ SMS sent via Africa's Talking to %s", maskPhoneNumber(phoneNumber))
	return nil
}

// sendViaTwilio sends SMS using Twilio API
func sendViaTwilio(phoneNumber, message string, config *SMSConfig) error {
	// Initialize Twilio client
	client := twilio.NewRestClient()

	// Prepare message parameters
	params := &openapi.CreateMessageParams{}
	params.SetTo(phoneNumber)
	params.SetFrom(config.TwilioFromNumber)
	params.SetBody(message)

	// Send SMS
	resp, err := client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("Twilio API error: %w", err)
	}

	log.Printf("✅ SMS sent via Twilio: SID=%s", *resp.Sid)
	return nil
}

// isAfricanNumber checks if a phone number is from an African country
func isAfricanNumber(phoneNumber string) bool {
	// Common African country codes
	africanPrefixes := []string{
		"+254", // Kenya
		"+255", // Tanzania
		"+256", // Uganda
		"+257", // Burundi
		"+258", // Mozambique
		"+260", // Zambia
		"+261", // Madagascar
		"+263", // Zimbabwe
		"+265", // Malawi
		"+267", // Botswana
		"+234", // Nigeria
		"+233", // Ghana
		"+237", // Cameroon
		"+251", // Ethiopia
		"+252", // Somalia
		"+27",  // South Africa
		"+212", // Morocco
		"+213", // Algeria
		"+216", // Tunisia
		"+218", // Libya
		"+220", // Gambia
		"+221", // Senegal
		"+222", // Mauritania
		"+223", // Mali
		"+224", // Guinea
		"+225", // Ivory Coast
		"+226", // Burkina Faso
		"+227", // Niger
		"+228", // Togo
		"+229", // Benin
		"+230", // Mauritius
		"+231", // Liberia
		"+232", // Sierra Leone
		"+235", // Chad
		"+236", // Central African Republic
		"+238", // Cape Verde
		"+239", // Sao Tome and Principe
		"+240", // Equatorial Guinea
		"+241", // Gabon
		"+242", // Republic of Congo
		"+243", // Democratic Republic of Congo
		"+244", // Angola
		"+245", // Guinea-Bissau
		"+246", // Diego Garcia
		"+248", // Seychelles
		"+249", // Sudan
		"+250", // Rwanda
		"+253", // Djibouti
		"+262", // Reunion
		"+264", // Namibia
		"+266", // Lesotho
		"+268", // Eswatini
		"+269", // Comoros
	}

	for _, prefix := range africanPrefixes {
		if strings.HasPrefix(phoneNumber, prefix) {
			return true
		}
	}

	return false
}

// maskPhoneNumber masks a phone number for logging (privacy)
func maskPhoneNumber(phoneNumber string) string {
	if len(phoneNumber) < 4 {
		return "***"
	}
	// Show first 3 and last 2 digits
	return phoneNumber[:3] + "****" + phoneNumber[len(phoneNumber)-2:]
}

// ValidatePhoneNumber performs basic phone number validation
func ValidatePhoneNumber(phoneNumber string) error {
	// Must start with +
	if !strings.HasPrefix(phoneNumber, "+") {
		return fmt.Errorf("phone number must start with + (international format)")
	}

	// Must be at least 10 characters (+XXX...)
	if len(phoneNumber) < 10 {
		return fmt.Errorf("phone number too short")
	}

	// Must be at most 15 characters (E.164 standard)
	if len(phoneNumber) > 15 {
		return fmt.Errorf("phone number too long")
	}

	// Must contain only digits after +
	for i, char := range phoneNumber[1:] {
		if char < '0' || char > '9' {
			return fmt.Errorf("invalid character at position %d: %c", i+1, char)
		}
	}

	return nil
}

// GetSMSCost estimates the cost of sending an SMS
func GetSMSCost(phoneNumber string) (provider string, cost float64) {
	if isAfricanNumber(phoneNumber) {
		// Africa's Talking pricing
		switch {
		case strings.HasPrefix(phoneNumber, "+254"): // Kenya
			return "africastalking", 0.008
		case strings.HasPrefix(phoneNumber, "+256"): // Uganda
			return "africastalking", 0.010
		case strings.HasPrefix(phoneNumber, "+255"): // Tanzania
			return "africastalking", 0.012
		case strings.HasPrefix(phoneNumber, "+234"): // Nigeria
			return "africastalking", 0.015
		case strings.HasPrefix(phoneNumber, "+233"): // Ghana
			return "africastalking", 0.015
		default:
			return "africastalking", 0.012 // Average
		}
	}

	// Twilio pricing for non-African numbers
	switch {
	case strings.HasPrefix(phoneNumber, "+1"): // USA/Canada
		return "twilio", 0.0079
	case strings.HasPrefix(phoneNumber, "+44"): // UK
		return "twilio", 0.0400
	default:
		return "twilio", 0.0550 // Average international
	}
}

// SMSStats tracks SMS statistics
type SMSStats struct {
	TotalSent          int
	SuccessCount       int
	FailureCount       int
	AfricasTalkingUsed int
	TwilioUsed         int
	TotalCost          float64
}

var smsStats = &SMSStats{}

// RecordSMSSuccess records a successful SMS delivery
func RecordSMSSuccess(phoneNumber, provider string) {
	smsStats.TotalSent++
	smsStats.SuccessCount++

	if provider == "africastalking" {
		smsStats.AfricasTalkingUsed++
	} else {
		smsStats.TwilioUsed++
	}

	_, cost := GetSMSCost(phoneNumber)
	smsStats.TotalCost += cost

	log.Printf("📊 SMS Stats: Total=%d, Success=%d, AT=%d, Twilio=%d, Cost=$%.2f",
		smsStats.TotalSent, smsStats.SuccessCount,
		smsStats.AfricasTalkingUsed, smsStats.TwilioUsed, smsStats.TotalCost)
}

// RecordSMSFailure records a failed SMS delivery
func RecordSMSFailure() {
	smsStats.TotalSent++
	smsStats.FailureCount++

	log.Printf("📊 SMS Stats: Total=%d, Failures=%d", smsStats.TotalSent, smsStats.FailureCount)
}

// GetSMSStats returns current SMS statistics
func GetSMSStats() *SMSStats {
	return smsStats
}
