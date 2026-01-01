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

// Simplified metadata and IPFS structures for this example
type TicketMetadata struct {
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Image       string            `json:"image"`
	ExternalURL string            `json:"external_url"`
	Attributes  []TicketAttribute `json:"attributes"`
}

type TicketAttribute struct {
	TraitType   string      `json:"trait_type"`
	Value       interface{} `json:"value"`
	DisplayType string      `json:"display_type,omitempty"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load("/workspaces/africa-railways/.env"); err != nil {
		log.Printf("Warning: .env file not found, using system environment variables")
	}

	// Get configuration
	alchemyURL := os.Getenv("POLYGON_RPC_URL")
	privateKeyHex := os.Getenv("POLYGON_PRIVATE_KEY")

	if alchemyURL == "" || privateKeyHex == "" {
		log.Fatal("POLYGON_RPC_URL and POLYGON_PRIVATE_KEY must be set")
	}

	fmt.Println("🎫 Africa Railways - NFT Ticket Minting System")
	fmt.Println("=" + string(make([]byte, 50)))

	// Step 1: Create ticket metadata
	fmt.Println("\n📋 Step 1: Creating Ticket Metadata...")
	
	ticketID := fmt.Sprintf("TKT%d", time.Now().Unix())
	_ = TicketMetadata{
		Name:        fmt.Sprintf("Africa Railways: Ticket #%s", ticketID),
		Description: "Standard Class Ticket - Johannesburg to Cape Town",
		Image:       "ipfs://QmYourTicketDesignCID", // Replace with actual QR code image
		ExternalURL: fmt.Sprintf("https://africarailways.com/verify/%s", ticketID),
		Attributes: []TicketAttribute{
			{TraitType: "Route", Value: "JHB-CPT"},
			{TraitType: "Class", Value: "Standard"},
			{TraitType: "Seat", Value: "14A"},
			{
				TraitType:   "Departure",
				Value:       time.Now().Add(24 * time.Hour).Unix(),
				DisplayType: "date",
			},
			{TraitType: "Passenger", Value: "John Doe"},
			{TraitType: "Phone", Value: "+27123456789"},
			{
				TraitType:   "Price",
				Value:       450.00,
				DisplayType: "number",
			},
			{TraitType: "Currency", Value: "ZAR"},
		},
	}

	fmt.Printf("   ✅ Ticket ID: %s\n", ticketID)
	fmt.Printf("   ✅ Route: JHB → CPT\n")
	fmt.Printf("   ✅ Passenger: John Doe\n")

	// Step 2: Upload metadata to IPFS (mocked for now)
	fmt.Println("\n📤 Step 2: Uploading Metadata to IPFS...")
	
	// In production, use actual IPFS upload:
	// uploader := ipfs.NewUploader("pinata")
	// metadataURI, err := uploader.UploadJSON(metadata)
	
	// For now, use mock URI
	metadataURI := fmt.Sprintf("ipfs://QmMockMetadata%d", time.Now().Unix())
	fmt.Printf("   ✅ Metadata URI: %s\n", metadataURI)

	// Step 3: Connect to Polygon
	fmt.Println("\n🔗 Step 3: Connecting to Polygon Amoy via Alchemy...")
	
	client, err := ethclient.Dial(alchemyURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	chainID, err := client.ChainID(ctx)
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}
	fmt.Printf("   ✅ Connected to Chain ID: %s\n", chainID.String())

	// Step 4: Load wallet
	fmt.Println("\n🔑 Step 4: Loading Relayer Wallet...")
	
	privateKey, err := crypto.HexToECDSA(privateKeyHex[2:])
	if err != nil {
		log.Fatalf("Failed to load private key: %v", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("Failed to cast public key")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	fmt.Printf("   ✅ Relayer Address: %s\n", fromAddress.Hex())

	// Check balance
	balance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatalf("Failed to get balance: %v", err)
	}
	fmt.Printf("   💰 Balance: %s MATIC\n", weiToEther(balance))

	if balance.Cmp(big.NewInt(0)) == 0 {
		fmt.Println("\n⚠️  WARNING: Wallet has 0 balance!")
		fmt.Println("Fund this address: https://faucet.polygon.technology")
		fmt.Printf("Address: %s\n", fromAddress.Hex())
		return
	}

	// Step 5: Prepare minting transaction
	fmt.Println("\n🎨 Step 5: Preparing Mint Transaction...")
	
	// Replace with your deployed contract address
	contractAddr := common.HexToAddress("0x0000000000000000000000000000000000000000")
	passengerAddr := common.HexToAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1")
	
	fmt.Printf("   Contract: %s\n", contractAddr.Hex())
	fmt.Printf("   Recipient: %s\n", passengerAddr.Hex())
	fmt.Printf("   Token URI: %s\n", metadataURI)

	// Get transaction parameters
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		log.Fatalf("Failed to get nonce: %v", err)
	}

	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatalf("Failed to get gas price: %v", err)
	}

	// Create transaction
	// Note: This is a placeholder. In production, encode the actual contract call:
	// data := encodeMinFunction(passengerAddr, metadataURI)
	value := big.NewInt(0)
	gasLimit := uint64(150000)

	tx := types.NewTransaction(nonce, contractAddr, value, gasLimit, gasPrice, nil)

	// Step 6: Sign transaction
	fmt.Println("\n✍️  Step 6: Signing Transaction...")
	
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		log.Fatalf("Failed to sign: %v", err)
	}

	fmt.Println("\n📝 Transaction Summary:")
	fmt.Printf("   Nonce: %d\n", nonce)
	fmt.Printf("   Gas Price: %s Gwei\n", weiToGwei(gasPrice))
	fmt.Printf("   Gas Limit: %d\n", gasLimit)
	fmt.Printf("   Estimated Cost: %s MATIC\n", 
		weiToEther(new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))))
	fmt.Printf("   Tx Hash: %s\n", signedTx.Hash().Hex())

	// Step 7: Send transaction (commented for safety)
	fmt.Println("\n🛰️  Step 7: Sending Request to Alchemy...")
	fmt.Println("   ⚠️  Transaction sending is disabled for safety")
	fmt.Println("   Uncomment the code below to enable minting")

	/*
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatalf("Failed to send transaction: %v", err)
	}

	fmt.Printf("   ✅ Transaction sent! Hash: %s\n", signedTx.Hash().Hex())
	fmt.Printf("   🔍 View on PolygonScan: https://amoy.polygonscan.com/tx/%s\n", 
		signedTx.Hash().Hex())

	// Step 8: Wait for confirmation
	fmt.Println("\n⏳ Step 8: Waiting for Confirmation...")
	
	receipt, err := waitForReceipt(ctx, client, signedTx.Hash())
	if err != nil {
		log.Fatalf("Failed to get receipt: %v", err)
	}

	if receipt.Status == 1 {
		fmt.Println("   ✅ Transaction Confirmed!")
		fmt.Printf("   Block: %d\n", receipt.BlockNumber.Uint64())
		fmt.Printf("   Gas Used: %d\n", receipt.GasUsed)
		fmt.Println("\n🎉 NFT Ticket Successfully Minted!")
	} else {
		fmt.Println("   ❌ Transaction Failed!")
	}
	*/

	fmt.Println("\n" + string(make([]byte, 50)))
	fmt.Println("✅ Ticket preparation complete!")
	fmt.Println("\n📊 Monitor on Alchemy Dashboard:")
	fmt.Println("   • Mempool: See pending transactions")
	fmt.Println("   • Analytics: Track daily minting activity")
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
