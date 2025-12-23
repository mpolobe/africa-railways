#!/bin/bash
set -e

echo "📤 Uploading Expo Builds to S3"
echo "================================"

# Load S3 bucket name
if [ -f ".s3-bucket-name" ]; then
    AWS_S3_BUCKET=$(cat .s3-bucket-name)
    echo "Using bucket: $AWS_S3_BUCKET"
elif [ -n "$AWS_S3_BUCKET" ]; then
    echo "Using bucket from environment: $AWS_S3_BUCKET"
else
    echo "❌ No S3 bucket configured"
    echo "Run ./scripts/setup-s3-simple.sh first or set AWS_S3_BUCKET environment variable"
    exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    exit 1
fi

# Check for build files
BUILD_DIR="./expo-builds"
if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR 2>/dev/null)" ]; then
    echo "❌ No build files found in $BUILD_DIR/"
    echo "Run ./scripts/build-expo.sh first"
    exit 1
fi

# Upload files
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
echo "Uploading to: $AWS_S3_BUCKET"
echo ""

UPLOADED=0
> "$BUILD_DIR/s3-urls.txt"  # Clear URLs file

for file in $BUILD_DIR/*; do
    if [ -f "$file" ]; then
        FILENAME=$(basename "$file")
        
        # Skip metadata files
        if [[ "$FILENAME" == *"-url.txt" ]] || [[ "$FILENAME" == "s3-urls.txt" ]] || [[ "$FILENAME" == "build-info-"* ]]; then
            continue
        fi
        
        S3_PATH="builds/$TIMESTAMP/$FILENAME"
        PLATFORM=$(echo "$FILENAME" | cut -d'-' -f1)
        
        echo "📦 Uploading: $FILENAME"
        
        # Upload to S3
        if aws s3 cp "$file" "s3://$AWS_S3_BUCKET/$S3_PATH" \
            --metadata "uploaded=$TIMESTAMP,platform=$PLATFORM"; then
            
            # Also upload as "latest"
            LATEST_PATH="builds/${PLATFORM}-latest.${FILENAME##*.}"
            aws s3 cp "$file" "s3://$AWS_S3_BUCKET/$LATEST_PATH" --quiet
            
            # Generate download URL (7 days)
            URL=$(aws s3 presign "s3://$AWS_S3_BUCKET/$S3_PATH" --expires-in 604800)
            
            echo "  ✓ Uploaded to: s3://$AWS_S3_BUCKET/$S3_PATH"
            echo "  🔗 Download URL (7 days): $URL"
            echo ""
            
            # Save URL
            echo "$FILENAME: $URL" >> "$BUILD_DIR/s3-urls.txt"
            echo "$URL" > "$BUILD_DIR/${PLATFORM}-url.txt"
            
            ((UPLOADED++))
        else
            echo "  ❌ Failed to upload: $FILENAME"
            echo ""
        fi
    fi
done

echo ""
echo "✅ Upload complete!"
echo "📊 Summary:"
echo "  • Uploaded: $UPLOADED files"
echo "  • Bucket: $AWS_S3_BUCKET"
echo "  • Timestamp: $TIMESTAMP"
echo ""
echo "📋 URLs saved to: $BUILD_DIR/s3-urls.txt"
echo "🌐 S3 Console: https://s3.console.aws.amazon.com/s3/buckets/$AWS_S3_BUCKET/builds/"
echo ""
echo "🔗 Latest builds:"
for url_file in $BUILD_DIR/*-url.txt; do
    if [ -f "$url_file" ] && [ "$url_file" != "$BUILD_DIR/s3-urls.txt" ]; then
        PLATFORM=$(basename "$url_file" | sed 's/-url.txt//')
        URL=$(cat "$url_file")
        echo "  • $PLATFORM: $URL"
    fi
done
