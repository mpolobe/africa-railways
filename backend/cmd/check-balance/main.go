package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

// getRelayerBalance fetches and displays the live balance
// This is the recommended function for checking POL balance
func getRelayerBalance(client *ethclient.Client, address common.Address) (*big.Float, error) {
	balance, err := client.BalanceAt(context.Background(), address, nil)
	if err != nil {
		return nil, err
	}
	// Convert from Wei to POL (18 decimals)
	fbalance := new(big.Float).SetInt(balance)
	return new(big.Float).Quo(fbalance, big.NewFloat(1e18)), nil
}

func main() {
	// Load environment variables
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables")
	}

	// Get configuration
	alchemyURL := os.Getenv("POLYGON_RPC_URL")
	relayerAddress := os.Getenv("POLYGON_RELAYER_ADDRESS")

	if alchemyURL == "" {
		log.Fatal("POLYGON_RPC_URL not set in environment")
	}
	if relayerAddress == "" {
		log.Fatal("POLYGON_RELAYER_ADDRESS not set in environment")
	}

	fmt.Println("💰 Africa Railways - Relayer Balance Checker")
	fmt.Println("=" + string(make([]byte, 50)))

	// Connect to Polygon
	fmt.Println("\n🔗 Connecting to Polygon Amoy via Alchemy...")
	client, err := ethclient.Dial(alchemyURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	// Get chain ID
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}
	fmt.Printf("✅ Connected to Chain ID: %s\n", chainID.String())

	// Parse address
	address := common.HexToAddress(relayerAddress)
	fmt.Printf("\n📍 Relayer Address: %s\n", address.Hex())

	// Get balance
	fmt.Println("\n💰 Fetching Live Balance...")
	balance, err := getRelayerBalance(client, address)
	if err != nil {
		log.Fatalf("Failed to get balance: %v", err)
	}

	// Display balance
	fmt.Println("\n" + string(make([]byte, 50)))
	fmt.Printf("Balance: %s POL\n", balance.Text('f', 6))
	fmt.Println(string(make([]byte, 50)))

	// Check if balance is sufficient
	minBalance := big.NewFloat(0.01) // Minimum recommended balance
	if balance.Cmp(minBalance) < 0 {
		fmt.Println("\n⚠️  WARNING: Low Balance!")
		fmt.Println("Your relayer wallet needs more POL tokens for gas fees.")
		fmt.Println("\n📍 Fund this address:")
		fmt.Printf("   %s\n", address.Hex())
		fmt.Println("\n🚰 Get test tokens from:")
		fmt.Println("   https://faucet.polygon.technology")
		
		if balance.Cmp(big.NewFloat(0)) == 0 {
			fmt.Println("\n❌ Balance is 0 - Cannot mint tickets!")
		} else {
			// Estimate how many transactions possible
			avgGasCost := big.NewFloat(0.0002) // ~0.0002 POL per mint
			txCount := new(big.Float).Quo(balance, avgGasCost)
			fmt.Printf("\n📊 Estimated transactions possible: ~%.0f\n", txCount)
		}
	} else {
		fmt.Println("\n✅ Balance is sufficient for minting!")
		
		// Estimate how many transactions possible
		avgGasCost := big.NewFloat(0.0002) // ~0.0002 POL per mint
		txCount := new(big.Float).Quo(balance, avgGasCost)
		fmt.Printf("\n📊 Estimated transactions possible: ~%.0f\n", txCount)
		fmt.Println("\n🎫 Ready to mint tickets!")
	}

	// Get current gas price
	fmt.Println("\n⛽ Current Network Gas Price:")
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Printf("Failed to get gas price: %v", err)
	} else {
		gasPriceGwei := new(big.Float).Quo(
			new(big.Float).SetInt(gasPrice),
			big.NewFloat(1e9),
		)
		fmt.Printf("   %s Gwei\n", gasPriceGwei.Text('f', 2))

		// Estimate cost per transaction
		gasLimit := uint64(150000) // Typical for NFT mint
		costPerTx := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
		costPerTxPOL := new(big.Float).Quo(
			new(big.Float).SetInt(costPerTx),
			big.NewFloat(1e18),
		)
		fmt.Printf("\n💸 Estimated cost per mint: %s POL\n", costPerTxPOL.Text('f', 6))
	}

	fmt.Println("\n" + string(make([]byte, 50)))
	fmt.Println("✅ Balance check complete!")
}
