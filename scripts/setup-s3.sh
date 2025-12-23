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

# Check AWS credentials
check_credentials() {
    print_header "Checking AWS Credentials"
    
    if aws sts get-caller-identity &> /dev/null; then
        print_success "AWS credentials configured"
        aws sts get-caller-identity
    else
        print_warning "AWS credentials not configured"
        print_info "Please configure AWS credentials:"
        echo ""
        echo "Option 1: Environment Variables"
        echo "  export AWS_ACCESS_KEY_ID=your_key"
        echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
        echo "  export AWS_DEFAULT_REGION=us-east-1"
        echo ""
        echo "Option 2: AWS Configure"
        echo "  aws configure"
        echo ""
        read -p "Would you like to run 'aws configure' now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws configure
        else
            print_error "AWS credentials required. Exiting."
            exit 1
        fi
    fi
}

# Get bucket configuration
get_bucket_config() {
    print_header "S3 Bucket Configuration"
    
    # Default values
    DEFAULT_BUCKET="africa-railways-builds"
    DEFAULT_REGION="us-east-1"
    
    read -p "Enter bucket name [$DEFAULT_BUCKET]: " BUCKET_NAME
    BUCKET_NAME=${BUCKET_NAME:-$DEFAULT_BUCKET}
    
    read -p "Enter AWS region [$DEFAULT_REGION]: " AWS_REGION
    AWS_REGION=${AWS_REGION:-$DEFAULT_REGION}
    
    echo ""
    print_info "Configuration:"
    echo "  Bucket: $BUCKET_NAME"
    echo "  Region: $AWS_REGION"
    echo ""
    
    read -p "Continue with this configuration? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled"
        exit 1
    fi
}

# Create S3 bucket
create_bucket() {
    print_header "Creating S3 Bucket"
    
    if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
        print_info "Creating bucket: $BUCKET_NAME"
        
        if [ "$AWS_REGION" = "us-east-1" ]; then
            aws s3 mb "s3://$BUCKET_NAME"
        else
            aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
        fi
        
        print_success "Bucket created"
    else
        print_warning "Bucket already exists: $BUCKET_NAME"
    fi
}

# Configure bucket for static website hosting
configure_website() {
    print_header "Configuring Static Website Hosting"
    
    # Create website configuration
    cat > /tmp/website-config.json <<EOF
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "error.html"
    }
}
EOF
    
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document error.html
    
    print_success "Website hosting configured"
}

# Set bucket policy for public read
set_bucket_policy() {
    print_header "Setting Bucket Policy"
    
    read -p "Make builds publicly accessible? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create bucket policy
        cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
        
        # Disable block public access
        aws s3api put-public-access-block \
            --bucket "$BUCKET_NAME" \
            --public-access-block-configuration \
            "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
        
        # Apply bucket policy
        aws s3api put-bucket-policy \
            --bucket "$BUCKET_NAME" \
            --policy file:///tmp/bucket-policy.json
        
        print_success "Bucket is now publicly accessible"
    else
        print_info "Bucket will remain private"
        print_info "You'll need AWS credentials to download builds"
    fi
}

# Enable versioning
enable_versioning() {
    print_header "Enabling Versioning"
    
    read -p "Enable versioning? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        
        print_success "Versioning enabled"
    else
        print_info "Versioning not enabled"
    fi
}

# Set lifecycle policy
set_lifecycle() {
    print_header "Setting Lifecycle Policy"
    
    read -p "Auto-delete old builds after 30 days? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > /tmp/lifecycle-policy.json <<EOF
{
    "Rules": [
        {
            "Id": "DeleteOldBuilds",
            "Status": "Enabled",
            "Prefix": "builds/",
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
EOF
        
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$BUCKET_NAME" \
            --lifecycle-configuration file:///tmp/lifecycle-policy.json
        
        print_success "Lifecycle policy set (30 days retention)"
    else
        print_info "Lifecycle policy not set"
    fi
}

# Create index.html
create_index() {
    print_header "Creating Index Page"
    
    cat > /tmp/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Africa Railways - Mobile Builds</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #0a0a0a;
            color: #ffffff;
        }
        h1 {
            color: #60a5fa;
            border-bottom: 2px solid #60a5fa;
            padding-bottom: 10px;
        }
        .build-list {
            margin-top: 30px;
        }
        .build-item {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .build-item h3 {
            margin-top: 0;
            color: #60a5fa;
        }
        .download-btn {
            background: #60a5fa;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
        }
        .download-btn:hover {
            background: #3b82f6;
        }
    </style>
</head>
<body>
    <h1>🚂 Africa Railways - Mobile Builds</h1>
    <p>Download the latest mobile app builds for Africa Railways.</p>
    
    <div class="build-list">
        <div class="build-item">
            <h3>📱 Latest Android Build</h3>
            <p>Platform: Android APK</p>
            <p>Profile: Preview</p>
            <a href="#" class="download-btn">Download APK</a>
        </div>
        
        <div class="build-item">
            <h3>🍎 Latest iOS Build</h3>
            <p>Platform: iOS IPA</p>
            <p>Profile: Preview</p>
            <a href="#" class="download-btn">Download IPA</a>
        </div>
    </div>
    
    <p style="margin-top: 50px; color: #666; font-size: 0.9em;">
        Builds are automatically uploaded from CI/CD pipeline.
    </p>
</body>
</html>
EOF
    
    aws s3 cp /tmp/index.html "s3://$BUCKET_NAME/index.html" \
        --content-type "text/html"
    
    print_success "Index page created"
}

# Save configuration
save_config() {
    print_header "Saving Configuration"
    
    cat > .s3-config <<EOF
BUCKET_NAME=$BUCKET_NAME
AWS_REGION=$AWS_REGION
EOF
    
    print_success "Configuration saved to .s3-config"
}

# Display summary
display_summary() {
    print_header "Setup Complete!"
    
    echo ""
    print_success "S3 bucket configured successfully"
    echo ""
    echo "Bucket Details:"
    echo "  Name: $BUCKET_NAME"
    echo "  Region: $AWS_REGION"
    echo "  Website URL: http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
    echo ""
    echo "Next Steps:"
    echo "  1. Run: ./scripts/deploy-build.sh"
    echo "  2. Or use GitHub Actions to auto-deploy"
    echo ""
    echo "Configuration saved to: .s3-config"
    echo ""
}

# Main execution
main() {
    print_header "Africa Railways - S3 Setup"
    
    check_aws_cli
    check_credentials
    get_bucket_config
    create_bucket
    configure_website
    set_bucket_policy
    enable_versioning
    set_lifecycle
    create_index
    save_config
    display_summary
}

main
