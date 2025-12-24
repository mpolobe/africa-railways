package main

import (
	"crypto/ecdsa"
	"fmt"
	"log"
	"os"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env from root
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	privateKeyHex := os.Getenv("RELAYER_PRIVATE_KEY")
	if privateKeyHex == "" {
		log.Fatal("RELAYER_PRIVATE_KEY not found in .env file")
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		log.Fatal(err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("error casting public key to ECDSA")
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()
	fmt.Printf("✅ Your RELAYER_ADDRESS is: %s\n", address)
}
