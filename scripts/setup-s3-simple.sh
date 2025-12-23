#!/bin/bash
set -e

echo "🔄 Setting up AWS S3 for Expo Builds"
echo "===================================="

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Check credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "⚠️  AWS credentials not found in environment"
    echo ""
    echo "Please set these environment variables:"
    echo "export AWS_ACCESS_KEY_ID='your-access-key'"
    echo "export AWS_SECRET_ACCESS_KEY='your-secret-key'"
    echo "export AWS_REGION='us-east-1'"
    echo ""
    echo "Or run: aws configure"
    exit 1
fi

# Create S3 bucket
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUCKET_NAME="expo-builds-$TIMESTAMP"
REGION=${AWS_REGION:-"us-east-1"}

echo "Creating S3 bucket: $BUCKET_NAME in $REGION"

# Create bucket
if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
else
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
fi

# Configure bucket
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy
BUCKET_POLICY='{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
        }
    ]
}'

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "$BUCKET_POLICY"

# Create builds folder
aws s3api put-object --bucket "$BUCKET_NAME" --key "builds/"

# Save bucket name
echo "$BUCKET_NAME" > .s3-bucket-name

echo ""
echo "✅ S3 bucket setup complete!"
echo ""
echo "📋 Bucket info:"
echo "• Name: $BUCKET_NAME"
echo "• Region: $REGION"
echo "• URL: https://$BUCKET_NAME.s3.amazonaws.com"
echo "• Builds: https://$BUCKET_NAME.s3.amazonaws.com/builds/"
echo ""
echo "💾 Bucket name saved to: .s3-bucket-name"
echo ""
echo "🚀 Ready to upload builds!"
echo "   Run: ./scripts/build-expo.sh"
