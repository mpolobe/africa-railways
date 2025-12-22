package sms

import (
	"fmt"
	"log"
	"os"

	africastalking "github.com/tech-kenya/africastalkingsms"
	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

// SMSProvider defines the interface for SMS services
type SMSProvider interface {
	SendSMS(to, message string) error
}

// AfricasTalkingProvider implements SMS using Africa's Talking
type AfricasTalkingProvider struct {
	username string
	apiKey   string
	sender   string
}

// TwilioProvider implements SMS using Twilio
type TwilioProvider struct {
	accountSID string
	authToken  string
	fromNumber string
	client     *twilio.RestClient
}

// NotificationService handles SMS notifications
type NotificationService struct {
	provider SMSProvider
}

// NewAfricasTalkingProvider creates a new Africa's Talking SMS provider
func NewAfricasTalkingProvider() *AfricasTalkingProvider {
	return &AfricasTalkingProvider{
		username: os.Getenv("AT_USERNAME"),
		apiKey:   os.Getenv("AT_API_KEY"),
		sender:   os.Getenv("AT_SENDER_ID"),
	}
}

// NewTwilioProvider creates a new Twilio SMS provider
func NewTwilioProvider() *TwilioProvider {
	accountSID := os.Getenv("TWILIO_ACCOUNT_SID")
	authToken := os.Getenv("TWILIO_AUTH_TOKEN")
	
	return &TwilioProvider{
		accountSID: accountSID,
		authToken:  authToken,
		fromNumber: os.Getenv("TWILIO_FROM_NUMBER"),
		client:     twilio.NewRestClientWithParams(twilio.ClientParams{
			Username: accountSID,
			Password: authToken,
		}),
	}
}

// SendSMS sends an SMS using Africa's Talking
func (at *AfricasTalkingProvider) SendSMS(to, message string) error {
	// Initialize Africa's Talking
	africastalking.Initialize(at.username, at.apiKey)
	
	// Send SMS
	recipients := []string{to}
	response, err := africastalking.SendSMS(message, recipients, at.sender)
	
	if err != nil {
		return fmt.Errorf("failed to send SMS via Africa's Talking: %w", err)
	}
	
	log.Printf("✅ SMS sent via Africa's Talking: %+v", response)
	return nil
}

// SendSMS sends an SMS using Twilio
func (tw *TwilioProvider) SendSMS(to, message string) error {
	params := &twilioApi.CreateMessageParams{}
	params.SetTo(to)
	params.SetFrom(tw.fromNumber)
	params.SetBody(message)
	
	resp, err := tw.client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("failed to send SMS via Twilio: %w", err)
	}
	
	log.Printf("✅ SMS sent via Twilio: SID=%s, Status=%s", *resp.Sid, *resp.Status)
	return nil
}

// NewNotificationService creates a new notification service
func NewNotificationService(providerType string) *NotificationService {
	var provider SMSProvider
	
	switch providerType {
	case "africastalking":
		provider = NewAfricasTalkingProvider()
	case "twilio":
		provider = NewTwilioProvider()
	default:
		log.Printf("⚠️  Unknown SMS provider: %s, defaulting to Africa's Talking", providerType)
		provider = NewAfricasTalkingProvider()
	}
	
	return &NotificationService{
		provider: provider,
	}
}

// SendTicketConfirmation sends a ticket purchase confirmation SMS
func (ns *NotificationService) SendTicketConfirmation(phoneNumber, route string, amount int) error {
	message := fmt.Sprintf(
		"🎟️ Africa Railways Ticket Confirmed!\n"+
			"Route: %s\n"+
			"Amount: %d AFRC\n"+
			"Thank you for traveling with us!",
		route, amount,
	)
	
	return ns.provider.SendSMS(phoneNumber, message)
}

// SendWalletTopUp sends a wallet top-up confirmation SMS
func (ns *NotificationService) SendWalletTopUp(phoneNumber string, amount, newBalance int) error {
	message := fmt.Sprintf(
		"💳 Wallet Top-Up Successful!\n"+
			"Amount: +%d AFRC\n"+
			"New Balance: %d AFRC\n"+
			"Africa Railways",
		amount, newBalance,
	)
	
	return ns.provider.SendSMS(phoneNumber, message)
}

// SendLowBalanceAlert sends a low balance warning SMS
func (ns *NotificationService) SendLowBalanceAlert(phoneNumber string, balance int) error {
	message := fmt.Sprintf(
		"⚠️ Low Balance Alert!\n"+
			"Current Balance: %d AFRC\n"+
			"Top up now to continue booking tickets.\n"+
			"Africa Railways",
		balance,
	)
	
	return ns.provider.SendSMS(phoneNumber, message)
}

// SendWelcomeSMS sends a welcome SMS to new users
func (ns *NotificationService) SendWelcomeSMS(phoneNumber, userName string) error {
	message := fmt.Sprintf(
		"🚂 Welcome to Africa Railways, %s!\n"+
			"Your sovereign wallet is ready with 1,250 AFRC.\n"+
			"Book your first ticket today!",
		userName,
	)
	
	return ns.provider.SendSMS(phoneNumber, message)
}

// SendDailyDigest sends a daily transaction summary
func (ns *NotificationService) SendDailyDigest(phoneNumber string, ticketCount, totalSpent, balance int) error {
	message := fmt.Sprintf(
		"📊 Daily Summary - Africa Railways\n"+
			"Tickets: %d\n"+
			"Spent: %d AFRC\n"+
			"Balance: %d AFRC\n"+
			"Safe travels!",
		ticketCount, totalSpent, balance,
	)
	
	return ns.provider.SendSMS(phoneNumber, message)
}
