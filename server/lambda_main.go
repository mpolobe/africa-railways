package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func HandleRequest(ctx context.Context, s3Event events.S3Event) error {
	for _, record := range s3Event.Records {
		bucket := record.S3.Bucket.Name
		key := record.S3.Object.Key
		fmt.Printf("🎯 New Voice Report detected: Bucket [%s], Key [%s]\n", bucket, key)

		// 1. Logic to pull audio from S3
		// 2. Call our ClassifyVoiceReport logic
		// 3. Update Sui/Digits AI
	}
	return nil
}

func main() {
	lambda.Start(HandleRequest)
}
