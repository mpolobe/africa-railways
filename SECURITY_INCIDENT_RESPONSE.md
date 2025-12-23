# 🚨 SECURITY INCIDENT RESPONSE

## IMMEDIATE ACTION REQUIRED

Your AWS credentials have been exposed in this conversation. Follow these steps immediately:

## Step 1: Disable Exposed Credentials (URGENT - Do This Now)

```bash
# Login to AWS Console
# Go to: https://console.aws.amazon.com/iam

# Or use AWS CLI to disable the exposed key:
aws iam update-access-key \
  --access-key-id AKIATPUJM4K5OFGJDYMB \
  --status Inactive \
  --user-name expo-build-bot-20251223
```

## Step 2: Delete the Exposed Access Key

```bash
# Delete the compromised key
aws iam delete-access-key \
  --access-key-id AKIATPUJM4K5OFGJDYMB \
  --user-name expo-build-bot-20251223
```

## Step 3: Create New Access Keys

```bash
# Create new access key for the IAM user
aws iam create-access-key --user-name expo-build-bot-20251223

# Save the output securely - you won't see it again!
```

## Step 4: Update Environment Variables

```bash
# Set new credentials in Gitpod (persistent)
gp env AWS_ACCESS_KEY_ID="NEW_KEY_HERE"
gp env AWS_SECRET_ACCESS_KEY="NEW_SECRET_HERE"

# Update .gitpod.env file
nano .gitpod.env
# Replace old credentials with new ones

# Update GitHub Secrets
# Go to: https://github.com/mpolobe/africa-railways/settings/secrets/actions
# Update: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

## Step 5: Check for Unauthorized Activity

```bash
# Check CloudTrail for any unauthorized access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=expo-build-bot-20251223 \
  --max-results 50

# Check S3 bucket access logs
aws s3api get-bucket-logging --bucket expo-builds-239732581050-20251223
```

## Step 6: Review S3 Bucket Security

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket expo-builds-239732581050-20251223

# Check for any unauthorized files
aws s3 ls s3://expo-builds-239732581050-20251223/ --recursive

# If you find unauthorized files, delete them:
# aws s3 rm s3://expo-builds-239732581050-20251223/suspicious-file.txt
```

## Prevention Measures

### 1. Never Share Credentials in:
- ❌ Chat messages
- ❌ Screenshots
- ❌ Code repositories
- ❌ Email
- ❌ Slack/Discord
- ❌ Documentation

### 2. Use Secure Methods:
- ✅ `gp env` command in Gitpod
- ✅ GitHub Secrets
- ✅ AWS Secrets Manager
- ✅ Environment variables (not committed)
- ✅ Password managers

### 3. Enable MFA:
```bash
# Enable MFA for your AWS account
# Go to: https://console.aws.amazon.com/iam
# Click your username → Security credentials → Assign MFA device
```

### 4. Use IAM Roles Instead of Keys (When Possible):
- For EC2 instances
- For Lambda functions
- For ECS tasks
- For GitHub Actions (OIDC)

### 5. Set Up AWS CloudTrail:
```bash
# Enable CloudTrail for audit logging
aws cloudtrail create-trail \
  --name security-audit-trail \
  --s3-bucket-name your-cloudtrail-bucket
```

### 6. Enable AWS GuardDuty:
```bash
# Enable GuardDuty for threat detection
aws guardduty create-detector --enable
```

## Quick Credential Rotation Script

Save this as `rotate-aws-credentials.sh`:

```bash
#!/bin/bash
set -e

IAM_USER="expo-build-bot-20251223"
OLD_KEY_ID="AKIATPUJM4K5OFGJDYMB"

echo "🔄 Rotating AWS credentials for $IAM_USER"

# 1. Deactivate old key
echo "1. Deactivating old key..."
aws iam update-access-key \
  --access-key-id "$OLD_KEY_ID" \
  --status Inactive \
  --user-name "$IAM_USER"

# 2. Create new key
echo "2. Creating new key..."
NEW_CREDS=$(aws iam create-access-key --user-name "$IAM_USER")
NEW_KEY_ID=$(echo $NEW_CREDS | jq -r '.AccessKey.AccessKeyId')
NEW_SECRET=$(echo $NEW_CREDS | jq -r '.AccessKey.SecretAccessKey')

echo ""
echo "✅ New credentials created:"
echo "AWS_ACCESS_KEY_ID: $NEW_KEY_ID"
echo "AWS_SECRET_ACCESS_KEY: $NEW_SECRET"
echo ""
echo "⚠️  SAVE THESE IMMEDIATELY - You won't see them again!"
echo ""

# 3. Update Gitpod environment
read -p "Update Gitpod environment variables? (y/n): " update_gitpod
if [[ $update_gitpod =~ ^[Yy]$ ]]; then
    gp env AWS_ACCESS_KEY_ID="$NEW_KEY_ID"
    gp env AWS_SECRET_ACCESS_KEY="$NEW_SECRET"
    echo "✅ Gitpod environment updated"
fi

# 4. Delete old key
read -p "Delete old key $OLD_KEY_ID? (y/n): " delete_old
if [[ $delete_old =~ ^[Yy]$ ]]; then
    aws iam delete-access-key \
      --access-key-id "$OLD_KEY_ID" \
      --user-name "$IAM_USER"
    echo "✅ Old key deleted"
fi

echo ""
echo "🎉 Credential rotation complete!"
echo ""
echo "Next steps:"
echo "1. Update GitHub Secrets"
echo "2. Update any other services using these credentials"
echo "3. Test the new credentials"
```

## Checklist

- [ ] Disabled exposed access key
- [ ] Deleted exposed access key
- [ ] Created new access key
- [ ] Updated Gitpod environment variables
- [ ] Updated GitHub Secrets
- [ ] Checked CloudTrail for unauthorized activity
- [ ] Reviewed S3 bucket for unauthorized files
- [ ] Enabled MFA on AWS account
- [ ] Documented incident
- [ ] Updated team on security practices

## Contact Information

If you suspect unauthorized access:
- AWS Support: https://console.aws.amazon.com/support
- AWS Security: aws-security@amazon.com
- Emergency: Call AWS Support directly

## Learn More

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS Security Hub](https://aws.amazon.com/security-hub/)

---

**Remember**: Treat credentials like passwords. Never share them publicly!
