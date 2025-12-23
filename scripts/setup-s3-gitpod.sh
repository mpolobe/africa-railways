#!/bin/bash
set -e

echo "🚀 Setting up AWS S3 for Expo builds in Gitpod..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
section() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Function to print info
info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
}

section "1. Checking AWS CLI Installation"
if command -v aws &> /dev/null; then
    success "AWS CLI is installed"
    aws --version
else
    error "AWS CLI not found. Installing..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    success "AWS CLI installed"
fi

section "2. Configure AWS Credentials"
if [ -f ~/.aws/credentials ]; then
    info "AWS credentials file exists"
    echo "Current profiles:"
    aws configure list-profiles
else
    info "No AWS credentials found. Let's set them up."
    echo ""
    echo "You need AWS credentials with permissions to:"
    echo "• Create S3 buckets"
    echo "• Create IAM users/policies"
    echo "• Upload files to S3"
    echo ""
    read -p "Do you have AWS credentials? (y/n): " has_creds
    
    if [[ $has_creds == "y" || $has_creds == "Y" ]]; then
        read -p "Enter AWS Access Key ID: " ACCESS_KEY
        read -sp "Enter AWS Secret Access Key: " SECRET_KEY
        echo ""
        read -p "Enter AWS Region (default: us-east-1): " REGION
        REGION=${REGION:-us-east-1}
        
        aws configure set aws_access_key_id "$ACCESS_KEY"
        aws configure set aws_secret_access_key "$SECRET_KEY"
        aws configure set region "$REGION"
        aws configure set output "json"
        
        success "AWS credentials configured"
    else
        info "You can create credentials at: https://console.aws.amazon.com/iam"
        info "Run this script again after getting credentials."
        exit 1
    fi
fi

section "3. Verify AWS Account"
ACCOUNT_INFO=$(aws sts get-caller-identity 2>/dev/null || echo "{}")
ACCOUNT_ID=$(echo $ACCOUNT_INFO | jq -r '.Account // empty')

if [ -z "$ACCOUNT_ID" ]; then
    error "Unable to verify AWS credentials"
    error "Please check your credentials and try again"
    exit 1
else
    success "Connected to AWS Account: $ACCOUNT_ID"
fi

section "4. Create S3 Bucket for Expo Builds"
# Generate unique bucket name
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BUCKET_NAME="expo-builds-$ACCOUNT_ID-$TIMESTAMP"
REGION=$(aws configure get region)
REGION=${REGION:-us-east-1}

info "Creating bucket: $BUCKET_NAME in $REGION"

# Create bucket
if aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || \
   aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region us-east-1 2>/dev/null; then
    success "Bucket created successfully"
else
    error "Failed to create bucket. Trying different name..."
    BUCKET_NAME="expo-builds-$ACCOUNT_ID"
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION"
    success "Bucket created with fallback name"
fi

section "5. Configure Bucket Policies"
# Create bucket policy for public reads
cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        },
        {
            "Sid": "AllowExpoUploads",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::$ACCOUNT_ID:root"
            },
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy.json
success "Bucket policy configured"

# Configure CORS
cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "MaxAgeSeconds": 3000,
            "AllowedHeaders": ["*"]
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/cors-config.json
success "CORS configured"

section "6. Create IAM User for CI/CD (Optional)"
read -p "Create IAM user for GitHub Actions? (y/n): " create_user

if [[ $create_user == "y" || $create_user == "Y" ]]; then
    USER_NAME="expo-build-bot-$TIMESTAMP"
    
    # Create user
    aws iam create-user --user-name "$USER_NAME"
    success "IAM user created: $USER_NAME"
    
    # Create access keys
    CREDS=$(aws iam create-access-key --user-name "$USER_NAME")
    ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKey.AccessKeyId')
    SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.AccessKey.SecretAccessKey')
    
    # Create policy
    cat > /tmp/s3-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::$BUCKET_NAME",
                "arn:aws:s3:::$BUCKET_NAME/*"
            ]
        }
    ]
}
EOF

    POLICY_ARN=$(aws iam create-policy \
        --policy-name "ExpoS3Access-$TIMESTAMP" \
        --policy-document file:///tmp/s3-policy.json \
        --query 'Policy.Arn' \
        --output text)
    
    # Attach policy
    aws iam attach-user-policy \
        --user-name "$USER_NAME" \
        --policy-arn "$POLICY_ARN"
    
    success "Policy attached to user"
    
    # Save credentials securely
    echo ""
    echo "🔐 IAM User Credentials (SAVE THESE):"
    echo "======================================"
    echo "AWS_ACCESS_KEY_ID: $ACCESS_KEY_ID"
    echo "AWS_SECRET_ACCESS_KEY: $SECRET_ACCESS_KEY"
    echo "AWS_REGION: $REGION"
    echo "AWS_S3_BUCKET: $BUCKET_NAME"
    echo ""
    info "Add these to GitHub Secrets for CI/CD"
fi

section "7. Save Configuration"
# Save to .env file
cat > .env.aws << EOF
# AWS Configuration for Expo Builds
# Generated on $(date)

AWS_S3_BUCKET=$BUCKET_NAME
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT_ID
S3_BASE_URL=https://$BUCKET_NAME.s3.$REGION.amazonaws.com

# For GitHub Actions:
# AWS_ACCESS_KEY_ID=your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here
EOF

# Save bucket name for scripts
echo "$BUCKET_NAME" > .s3-bucket-name

success "Configuration saved to .env.aws"

section "8. Test S3 Access"
# Create test file
echo "Test file created at $(date)" > test-upload.txt

# Upload to S3
aws s3 cp test-upload.txt s3://$BUCKET_NAME/test-upload.txt --acl public-read
success "File uploaded to S3"

# Generate pre-signed URL (valid 1 hour)
TEST_URL=$(aws s3 presign s3://$BUCKET_NAME/test-upload.txt --expires-in 3600)
info "Test URL (valid 1 hour): $TEST_URL"

# Clean up test file
rm test-upload.txt

section "🎉 Setup Complete!"
echo ""
echo "📋 Summary:"
echo "• Bucket: $BUCKET_NAME"
echo "• Region: $REGION"
echo "• Account: $ACCOUNT_ID"
echo ""
echo "🔗 Bucket URLs:"
echo "• Console: https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
echo "• Public: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/"
echo ""
echo "🚀 Next steps in Gitpod:"
echo "1. Run: eas login"
echo "2. Run: ./scripts/deploy-build.sh to build and deploy"
echo "3. Check .env.aws for configuration"
echo ""
echo "📝 For GitHub Actions, add these secrets:"
echo "AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET"
