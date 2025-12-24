package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from project root
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables")
	}

	// Get configuration from environment
	alchemyURL := os.Getenv("POLYGON_RPC_URL")
	privateKeyHex := os.Getenv("POLYGON_PRIVATE_KEY")
	
	if alchemyURL == "" {
		log.Fatal("POLYGON_RPC_URL not set in environment")
	}
	if privateKeyHex == "" {
		log.Fatal("POLYGON_PRIVATE_KEY not set in environment")
	}

	// Connect to Polygon via Alchemy
	fmt.Println("🔗 Connecting to Polygon Amoy via Alchemy...")
	client, err := ethclient.Dial(alchemyURL)
	if err != nil {
		log.Fatalf("Failed to connect to Alchemy: %v", err)
	}
	defer client.Close()

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	chainID, err := client.ChainID(ctx)
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}
	fmt.Printf("✅ Connected to Chain ID: %s\n", chainID.String())

	// Load private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex[2:]) // Remove 0x prefix
	if err != nil {
		log.Fatalf("Failed to load private key: %v", err)
	}

	// Get public key and address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("Failed to cast public key to ECDSA")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Printf("🔑 Relayer Address: %s\n", fromAddress.Hex())

	// Check balance
	balance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatalf("Failed to get balance: %v", err)
	}
	fmt.Printf("💰 Balance: %s MATIC\n", weiToEther(balance))

	if balance.Cmp(big.NewInt(0)) == 0 {
		fmt.Println("\n⚠️  WARNING: Wallet has 0 balance!")
		fmt.Println("Please fund this address with test MATIC from:")
		fmt.Println("https://faucet.polygon.technology")
		fmt.Printf("Address: %s\n", fromAddress.Hex())
		return
	}

	// Example: Prepare ticket minting transaction
	// Replace with your actual contract address once deployed
	contractAddr := common.HexToAddress("0x0000000000000000000000000000000000000000")
	passengerAddr := common.HexToAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1") // Example
	
	fmt.Println("\n🎫 Preparing NFT Ticket Mint Transaction...")
	fmt.Printf("   Contract: %s\n", contractAddr.Hex())
	fmt.Printf("   Passenger: %s\n", passengerAddr.Hex())
	fmt.Printf("   Metadata: ipfs://QmTicketDataHash\n")

	// Get nonce
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		log.Fatalf("Failed to get nonce: %v", err)
	}

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatalf("Failed to get gas price: %v", err)
	}

	// Create transaction
	// Note: This is a placeholder. You'll need to encode the actual contract call
	// using abigen-generated bindings or manual ABI encoding
	value := big.NewInt(0)
	gasLimit := uint64(100000)
	
	// For now, this is a simple value transfer as an example
	tx := types.NewTransaction(nonce, contractAddr, value, gasLimit, gasPrice, nil)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		log.Fatalf("Failed to sign transaction: %v", err)
	}

	fmt.Println("\n📝 Transaction Details:")
	fmt.Printf("   Nonce: %d\n", nonce)
	fmt.Printf("   Gas Price: %s Gwei\n", weiToGwei(gasPrice))
	fmt.Printf("   Gas Limit: %d\n", gasLimit)
	fmt.Printf("   Estimated Cost: %s MATIC\n", weiToEther(new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))))
	fmt.Printf("   Tx Hash (if sent): %s\n", signedTx.Hash().Hex())

	// Send transaction (commented out for safety - uncomment when ready)
	/*
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatalf("Failed to send transaction: %v", err)
	}

	fmt.Printf("\n✅ Transaction sent! Hash: %s\n", signedTx.Hash().Hex())
	fmt.Printf("🔍 View on PolygonScan: https://amoy.polygonscan.com/tx/%s\n", signedTx.Hash().Hex())

	// Wait for confirmation
	fmt.Println("\n⏳ Waiting for confirmation...")
	receipt, err := waitForReceipt(ctx, client, signedTx.Hash())
	if err != nil {
		log.Fatalf("Failed to get receipt: %v", err)
	}

	if receipt.Status == 1 {
		fmt.Println("✅ Transaction confirmed!")
		fmt.Printf("   Block: %d\n", receipt.BlockNumber.Uint64())
		fmt.Printf("   Gas Used: %d\n", receipt.GasUsed)
	} else {
		fmt.Println("❌ Transaction failed!")
	}
	*/

	fmt.Println("\n⚠️  Note: Transaction sending is commented out for safety.")
	fmt.Println("Uncomment the SendTransaction section when you're ready to mint.")
}

func weiToEther(wei *big.Int) string {
	ether := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e18),
	)
	return ether.Text('f', 6)
}

// getGasBalance returns the balance in POL (Polygon native token)
func getGasBalance(client *ethclient.Client, account common.Address) *big.Float {
	balance, err := client.BalanceAt(context.Background(), account, nil)
	if err != nil {
		return big.NewFloat(0)
	}
	// Convert wei to POL (18 decimals)
	fbalance := new(big.Float)
	fbalance.SetString(balance.String())
	polValue := new(big.Float).Quo(fbalance, big.NewFloat(1e18))
	return polValue
}

func weiToGwei(wei *big.Int) string {
	gwei := new(big.Float).Quo(
		new(big.Float).SetInt(wei),
		big.NewFloat(1e9),
	)
	return gwei.Text('f', 2)
}

func waitForReceipt(ctx context.Context, client *ethclient.Client, txHash common.Hash) (*types.Receipt, error) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			receipt, err := client.TransactionReceipt(ctx, txHash)
			if err == nil {
				return receipt, nil
			}
		}
	}
}
