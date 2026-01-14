package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
)

// Custodial wallet key management for USSD users
// Derives deterministic keypairs from phone numbers

var (
	// Master secret for key derivation - MUST be set in production
	WalletMasterSecret = getWalletMasterSecret()
	
	// Salt for address derivation (must match js/zklogin.js PhoneWallet)
	AddressSalt = "africa-railways-phone-wallet-v1"
	
	// Salt for private key derivation
	PrivKeySalt = "africa-railways-custodial-privkey-v1"
)

// CustodialWallet represents a wallet derived from phone number
type CustodialWallet struct {
	PhoneNumber      string `json:"phone_number"`
	NormalizedDigits string `json:"normalized_digits"`
	Address          string `json:"address"`
	PrivateKeyHex    string `json:"-"` // Never expose in JSON
}

func getWalletMasterSecret() string {
	secret := os.Getenv("WALLET_MASTER_SECRET")
	if secret == "" {
		log.Println("⚠️ WALLET_MASTER_SECRET not set, using dev default")
		return "africa-railways-dev-secret-change-in-production"
	}
	return secret
}

// NormalizePhone normalizes phone number to 10 digits
// Must match the JavaScript implementation in PhoneWallet.generateWallet()
func NormalizePhone(phoneNumber string) string {
	// Remove all non-digit characters except +
	re := regexp.MustCompile(`[^\d+]`)
	cleaned := re.ReplaceAllString(phoneNumber, "")
	
	// Remove + and get digits
	digits := strings.ReplaceAll(cleaned, "+", "")
	
	// Get last 10 digits, pad if needed
	if len(digits) > 10 {
		digits = digits[len(digits)-10:]
	}
	for len(digits) < 10 {
		digits = "0" + digits
	}
	
	return digits
}

// DeriveAddress derives SUI wallet address from phone number
// MUST match the JavaScript PhoneWallet.generateWallet() algorithm exactly
func DeriveAddress(phoneNumber string) string {
	digits := NormalizePhone(phoneNumber)
	
	// Create deterministic seed (matches JS implementation)
	inputStr := digits + AddressSalt
	
	// SHA-256 hash
	hash := sha256.Sum256([]byte(inputStr))
	
	// Convert to hex address (0x + 64 hex chars)
	return "0x" + hex.EncodeToString(hash[:])
}

// DerivePrivateKey derives private key from phone number using HMAC
func DerivePrivateKey(phoneNumber string) string {
	digits := NormalizePhone(phoneNumber)
	
	// Use HMAC-SHA256 with master secret
	keyInput := fmt.Sprintf("%s:%s", digits, PrivKeySalt)
	
	h := hmac.New(sha256.New, []byte(WalletMasterSecret))
	h.Write([]byte(keyInput))
	privateKeyBytes := h.Sum(nil)
	
	return hex.EncodeToString(privateKeyBytes)
}

// GetCustodialWallet gets or creates a custodial wallet for a phone number
func GetCustodialWallet(phoneNumber string) *CustodialWallet {
	digits := NormalizePhone(phoneNumber)
	address := DeriveAddress(phoneNumber)
	privateKey := DerivePrivateKey(phoneNumber)
	
	log.Printf("🔐 Derived custodial wallet for %s***", phoneNumber[:6])
	
	return &CustodialWallet{
		PhoneNumber:      phoneNumber,
		NormalizedDigits: digits,
		Address:          address,
		PrivateKeyHex:    privateKey,
	}
}

// VerifyAddressMatches verifies that a phone number derives to the expected address
func VerifyAddressMatches(phoneNumber, expectedAddress string) bool {
	derived := DeriveAddress(phoneNumber)
	return strings.EqualFold(derived, expectedAddress)
}

// PrivateKeyToSUIFormat converts raw private key to SUI keypair format
// SUI uses Ed25519 keys with a specific encoding
func PrivateKeyToSUIFormat(privateKeyHex string) (string, error) {
	// SUI Ed25519 flag byte
	const ed25519Flag = 0x00
	
	// Convert hex to bytes
	keyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return "", fmt.Errorf("invalid private key hex: %w", err)
	}
	
	// Prepend flag byte
	suiKey := append([]byte{ed25519Flag}, keyBytes...)
	
	// Base64 encode
	return base64.StdEncoding.EncodeToString(suiKey), nil
}

// PaymentSource indicates where the payment request originated
type PaymentSource string

const (
	PaymentSourceUSSD PaymentSource = "ussd"      // Custodial - backend signs
	PaymentSourceWeb  PaymentSource = "web"       // zkLogin - user signs
	PaymentSourceApp  PaymentSource = "app"       // Could be either
)

// DeterminePaymentSource determines how to process payment based on context
func DeterminePaymentSource(walletAddress, phoneNumber string, hasZkProof bool) PaymentSource {
	// If we have a zkLogin proof, user signed via web
	if hasZkProof {
		return PaymentSourceWeb
	}
	
	// If wallet matches phone-derived address, use custodial
	if phoneNumber != "" && VerifyAddressMatches(phoneNumber, walletAddress) {
		return PaymentSourceUSSD
	}
	
	// Default to web (requires user signature)
	return PaymentSourceWeb
}
