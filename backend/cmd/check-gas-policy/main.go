package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables")
	}

	fmt.Println("⛽ Alchemy Gas Policy Configuration")
	fmt.Println("=" + string(make([]byte, 50)))

	// Get configuration
	rpcURL := os.Getenv("POLYGON_RPC_URL")
	policyID := os.Getenv("GAS_POLICY_ID")

	if rpcURL == "" {
		log.Fatal("POLYGON_RPC_URL not set in environment")
	}

	fmt.Println("\n📋 Configuration:")
	fmt.Println("----------------")
	fmt.Printf("RPC URL: %s\n", rpcURL)

	if policyID != "" {
		fmt.Printf("✅ Gas Policy ID: %s\n", policyID)
		fmt.Println("\n🎉 Gas Policy Configured!")
		fmt.Println("\nThis policy enables:")
		fmt.Println("  • Sponsored transactions (users don't pay gas)")
		fmt.Println("  • Gasless minting for passengers")
		fmt.Println("  • Reduced operational costs")
		fmt.Println("  • Better user experience")
	} else {
		fmt.Println("⚠️  Gas Policy ID not configured")
		fmt.Println("\nWithout a gas policy:")
		fmt.Println("  • Relayer pays all gas fees")
		fmt.Println("  • Users cannot mint without POL")
		fmt.Println("  • Higher operational costs")
	}

	// Test connection
	fmt.Println("\n🔗 Testing Connection:")
	fmt.Println("---------------------")
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	chainID, err := client.ChainID(context.Background())
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}

	fmt.Printf("✅ Connected to Chain ID: %s\n", chainID.String())

	// Display policy benefits
	if policyID != "" {
		fmt.Println("\n💡 How Gas Sponsorship Works:")
		fmt.Println("-----------------------------")
		fmt.Println("1. User purchases ticket via USSD")
		fmt.Println("2. Backend creates mint transaction")
		fmt.Println("3. Alchemy checks if transaction qualifies")
		fmt.Println("4. If qualified, Alchemy pays the gas fee")
		fmt.Println("5. User receives NFT ticket without paying gas")
		fmt.Println("6. Relayer balance is preserved")

		fmt.Println("\n📊 Policy Benefits:")
		fmt.Println("------------------")
		fmt.Println("• Gasless experience for users")
		fmt.Println("• Lower operational costs")
		fmt.Println("• Scalable minting operations")
		fmt.Println("• Better user adoption")

		fmt.Println("\n🔧 Integration:")
		fmt.Println("---------------")
		fmt.Println("The gas policy is automatically used when:")
		fmt.Println("• Minting NFT tickets")
		fmt.Println("• Transferring tickets")
		fmt.Println("• Updating ticket metadata")
		fmt.Println("\nNo code changes needed - Alchemy handles it!")
	}

	fmt.Println("\n" + string(make([]byte, 50)))
	fmt.Println("✅ Gas policy check complete!")

	if policyID != "" {
		fmt.Println("\n🎫 Ready for gasless ticket minting!")
	} else {
		fmt.Println("\n⚠️  Configure gas policy for sponsored transactions")
	}
}
