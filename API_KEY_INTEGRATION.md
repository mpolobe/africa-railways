# 🔐 API Key Integration Guide

## ⚠️ SECURITY WARNING

**NEVER commit API keys to git!** The key you shared should be stored securely.

## Your API Key

```
4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw
```

This appears to be a Google OAuth token or API key.

## Secure Storage

### 1. Add to .env File (Gitignored)

```bash
# backend/.env
GOOGLE_API_KEY=4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw
```

### 2. Add to config.json (Gitignored)

```json
{
  "alchemyEndpoint": "https://polygon-amoy.g.alchemy.com/v2/4-gxorN-H4MhqZWrskRQ-",
  "gasPolicyId": "2e114558-d9e8-4a3c-8290-ff9e6023f486",
  "ipfsApiKey": "787a512e.0a43e609db2a4913a861b6f0de5dd6e7",
  "relayerAddress": "0xYourRelayerAddressHere",
  "googleApiKey": "4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw"
}
```

### 3. Environment Variable

```bash
# Add to ~/.bashrc or ~/.zshrc
export GOOGLE_API_KEY="4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw"

# Reload shell
source ~/.bashrc
```

## Usage in Code

### Go Example

```go
package main

import (
    "os"
    "log"
)

func main() {
    // Load from environment
    apiKey := os.Getenv("GOOGLE_API_KEY")
    if apiKey == "" {
        log.Fatal("GOOGLE_API_KEY not set")
    }
    
    // Use the API key
    // ...
}
```

### With Config File

```go
type Config struct {
    GoogleAPIKey string `json:"googleApiKey"`
}

func loadConfig() (*Config, error) {
    data, err := os.ReadFile("config.json")
    if err != nil {
        return nil, err
    }
    
    var config Config
    if err := json.Unmarshal(data, &config); err != nil {
        return nil, err
    }
    
    return &config, nil
}
```

## Verify .gitignore

Ensure these files are in `.gitignore`:

```bash
# Check .gitignore
cat .gitignore | grep -E "(config.json|\.env)"
```

Should show:
```
config.json
backend/.env
.env
*.env
```

## If Key Was Accidentally Committed

### 1. Remove from Git History

```bash
# Remove file from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

### 2. Rotate the Key

**IMPORTANT**: If this key was committed to git, you should:
1. Revoke the old key
2. Generate a new key
3. Update your configuration

## Key Type Identification

Based on the format `4/0ATX...`, this appears to be:

### Google OAuth 2.0 Authorization Code

If this is an OAuth authorization code:

```bash
# Exchange for access token
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

### Google API Key

If this is a Google API key for services like:
- Google Maps
- Google Cloud APIs
- YouTube Data API

```go
// Example: Using with Google Cloud
import "google.golang.org/api/option"

func main() {
    ctx := context.Background()
    apiKey := os.Getenv("GOOGLE_API_KEY")
    
    client, err := someservice.NewService(ctx, 
        option.WithAPIKey(apiKey))
    if err != nil {
        log.Fatal(err)
    }
}
```

## Integration with Africa Railways

### If for GCP Authentication

```bash
# Set as application default credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Or use gcloud
gcloud auth application-default login
```

### If for Google Maps (Route Planning)

```go
// backend/pkg/maps/client.go
package maps

import (
    "context"
    "googlemaps.github.io/maps"
)

func NewMapsClient() (*maps.Client, error) {
    apiKey := os.Getenv("GOOGLE_API_KEY")
    return maps.NewClient(maps.WithAPIKey(apiKey))
}

func GetRouteDistance(from, to string) (float64, error) {
    client, err := NewMapsClient()
    if err != nil {
        return 0, err
    }
    
    // Calculate route distance
    // ...
}
```

### If for YouTube (Marketing/Tutorials)

```go
// backend/pkg/youtube/client.go
package youtube

import (
    "google.golang.org/api/youtube/v3"
    "google.golang.org/api/option"
)

func NewYouTubeClient() (*youtube.Service, error) {
    ctx := context.Background()
    apiKey := os.Getenv("GOOGLE_API_KEY")
    
    return youtube.NewService(ctx, 
        option.WithAPIKey(apiKey))
}
```

## Security Best Practices

### 1. Restrict API Key

In Google Cloud Console:
1. Go to APIs & Services > Credentials
2. Click on your API key
3. Set restrictions:
   - **Application restrictions**: HTTP referrers or IP addresses
   - **API restrictions**: Only enable needed APIs

### 2. Rotate Keys Regularly

```bash
# Generate new key
gcloud alpha services api-keys create \
    --display-name="Africa Railways API Key" \
    --project=africa-railways-481823

# Update configuration
# Delete old key after verification
```

### 3. Monitor Usage

```bash
# Check API key usage
gcloud services api-keys lookup \
    --key-string="YOUR_API_KEY"
```

### 4. Use Service Accounts for Production

Instead of API keys, use service accounts:

```bash
# Create service account
gcloud iam service-accounts create africa-railways-api \
    --display-name="Africa Railways API Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding africa-railways-481823 \
    --member="serviceAccount:africa-railways-api@africa-railways-481823.iam.gserviceaccount.com" \
    --role="roles/editor"

# Create key
gcloud iam service-accounts keys create ~/africa-railways-api-key.json \
    --iam-account=africa-railways-api@africa-railways-481823.iam.gserviceaccount.com
```

## Testing

### Test API Key

```bash
# Test with curl (example for Maps API)
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Johannesburg&key=YOUR_API_KEY"

# Test with Go
go run test-api-key.go
```

### Test in Relayer

```bash
# Set environment variable
export GOOGLE_API_KEY="4/0ATX87lMSK6Ko84IahZvklAP5AsQ3uk1lWICkMXqHYCB7nsKMwuu3HMXEnzaYiZrK8jhXjw"

# Start relayer
./relayer

# Check logs for API usage
tail -f logs/relayer.log
```

## Troubleshooting

### Invalid API Key

**Error**: "API key not valid"

```bash
# Verify key format
echo $GOOGLE_API_KEY | wc -c
# Should be reasonable length

# Check if key is enabled
gcloud services api-keys describe YOUR_KEY_ID
```

### Permission Denied

**Error**: "Permission denied"

```bash
# Check API is enabled
gcloud services list --enabled

# Enable required API
gcloud services enable maps-backend.googleapis.com
```

### Rate Limit Exceeded

**Error**: "Quota exceeded"

```bash
# Check quota
gcloud services quota list --service=maps-backend.googleapis.com

# Request quota increase
# Go to Google Cloud Console > IAM & Admin > Quotas
```

## Next Steps

1. ✅ Store key securely in `.env` or `config.json`
2. ✅ Verify `.gitignore` includes these files
3. ✅ Identify what service this key is for
4. ✅ Restrict key in Google Cloud Console
5. ✅ Test key with your service
6. ✅ Set up monitoring for usage
7. ✅ Plan key rotation schedule

## Support

- **Google Cloud Console**: https://console.cloud.google.com/
- **API Keys**: https://console.cloud.google.com/apis/credentials
- **Project**: africa-railways-481823

---

**Remember: NEVER commit API keys to git! Always use environment variables or gitignored config files.**
