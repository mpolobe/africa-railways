package config

import (
	"fmt"
	"os"
	"strings"
)

// RequiredEnvVar represents a required environment variable
type RequiredEnvVar struct {
	Name        string
	Description string
	Required    bool
	DefaultValue string
}

// Config holds all environment variables
type Config struct {
	Port           string
	ATAPIKey       string
	ATUsername     string
	TwilioSID      string
	TwilioToken    string
	TwilioPhone    string
	Environment    string
}

// RequiredVars defines all environment variables
var RequiredVars = []RequiredEnvVar{
	{
		Name:        "PORT",
		Description: "Server port",
		Required:    false,
		DefaultValue: "8080",
	},
	{
		Name:        "AT_API_KEY",
		Description: "Africa's Talking API Key",
		Required:    false,
		DefaultValue: "",
	},
	{
		Name:        "AT_USERNAME",
		Description: "Africa's Talking Username",
		Required:    false,
		DefaultValue: "",
	},
	{
		Name:        "TWILIO_ACCOUNT_SID",
		Description: "Twilio Account SID",
		Required:    false,
		DefaultValue: "",
	},
	{
		Name:        "TWILIO_AUTH_TOKEN",
		Description: "Twilio Auth Token",
		Required:    false,
		DefaultValue: "",
	},
	{
		Name:        "TWILIO_PHONE_NUMBER",
		Description: "Twilio Phone Number",
		Required:    false,
		DefaultValue: "",
	},
	{
		Name:        "ENVIRONMENT",
		Description: "Environment (development, staging, production)",
		Required:    false,
		DefaultValue: "development",
	},
}

// ValidateEnv validates all required environment variables
func ValidateEnv() (*Config, []string, []string) {
	var missing []string
	var warnings []string

	config := &Config{}

	for _, envVar := range RequiredVars {
		value := os.Getenv(envVar.Name)

		if value == "" {
			if envVar.Required {
				missing = append(missing, fmt.Sprintf("  ❌ %s - %s", envVar.Name, envVar.Description))
			} else if envVar.DefaultValue != "" {
				warnings = append(warnings, fmt.Sprintf("  ⚠️  %s not set, using default: %s", envVar.Name, envVar.DefaultValue))
				value = envVar.DefaultValue
			} else {
				warnings = append(warnings, fmt.Sprintf("  ⚠️  %s not set - %s", envVar.Name, envVar.Description))
			}
		}

		// Assign to config
		switch envVar.Name {
		case "PORT":
			config.Port = value
		case "AT_API_KEY":
			config.ATAPIKey = value
		case "AT_USERNAME":
			config.ATUsername = value
		case "TWILIO_ACCOUNT_SID":
			config.TwilioSID = value
		case "TWILIO_AUTH_TOKEN":
			config.TwilioToken = value
		case "TWILIO_PHONE_NUMBER":
			config.TwilioPhone = value
		case "ENVIRONMENT":
			config.Environment = value
		}
	}

	return config, missing, warnings
}

// PrintValidationReport prints a formatted validation report
func PrintValidationReport(config *Config, missing []string, warnings []string) {
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Println("🔍 Environment Variable Validation")
	fmt.Println(strings.Repeat("=", 60))

	if len(missing) > 0 {
		fmt.Println("\n❌ Missing Required Variables:")
		for _, msg := range missing {
			fmt.Println(msg)
		}
	}

	if len(warnings) > 0 {
		fmt.Println("\n⚠️  Warnings:")
		for _, msg := range warnings {
			fmt.Println(msg)
		}
	}

	if len(missing) == 0 && len(warnings) == 0 {
		fmt.Println("\n✅ All environment variables validated successfully!")
	}

	fmt.Println("\n📋 Current Configuration:")
	fmt.Println(strings.Repeat("-", 60))
	fmt.Printf("  Port:        %s\n", config.Port)
	fmt.Printf("  Environment: %s\n", config.Environment)
	fmt.Printf("  AT API:      %s\n", maskValue(config.ATAPIKey))
	fmt.Printf("  Twilio SID:  %s\n", maskValue(config.TwilioSID))
	fmt.Println(strings.Repeat("=", 60) + "\n")
}

// maskValue masks sensitive values for display
func maskValue(value string) string {
	if value == "" {
		return "Not set"
	}
	if len(value) <= 8 {
		return "***"
	}
	return value[:4] + "..." + value[len(value)-4:]
}

// MustValidate validates environment and exits if required vars are missing
func MustValidate() *Config {
	config, missing, warnings := ValidateEnv()
	PrintValidationReport(config, missing, warnings)

	if len(missing) > 0 {
		fmt.Println("❌ Cannot start server with missing required variables")
		os.Exit(1)
	}

	return config
}
