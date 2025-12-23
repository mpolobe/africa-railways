# Download Page Setup Guide

Complete guide for setting up and deploying the mobile app download page.

## 📱 What You Get

A beautiful, responsive download page that:
- ✅ Automatically fetches latest builds from S3
- ✅ Shows version information and file sizes
- ✅ Generates QR codes for easy mobile downloads
- ✅ Provides installation instructions
- ✅ Works on all devices (mobile, tablet, desktop)
- ✅ Updates automatically when new builds are uploaded

## 🚀 Quick Setup

### Step 1: Configure AWS Credentials

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID="your_key_here"
export AWS_SECRET_ACCESS_KEY="your_secret_here"
export AWS_DEFAULT_REGION="eu-north-1"

# Or use aws configure
aws configure
```

### Step 2: Deploy the Download Page

```bash
# Run the deployment script
./scripts/deploy-download-page.sh
```

### Step 3: Access Your Download Page

The script will output URLs like:

```
Website URL:
  http://expo-builds-239732581050-20251223.s3-website-eu-north-1.amazonaws.com

Direct S3 URL:
  https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/index.html
```

## 🌐 Live URLs

Once deployed, your download page will be available at:

### Primary URL (Website Hosting)
```
http://expo-builds-239732581050-20251223.s3-website-eu-north-1.amazonaws.com
```

### Alternative URLs
```
https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/index.html
https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/download.html
```

## 📋 Features

### Automatic Build Detection
The page automatically fetches the latest build information from:
```
https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/manifests/latest.json
```

### QR Code Generation
- Click "Show QR Code" button
- QR code is generated on-the-fly
- Users can scan with their phone to download

### Version Information
Displays:
- Version number
- Git commit hash
- File size
- Last updated date

### Responsive Design
- Works on mobile, tablet, and desktop
- Touch-friendly buttons
- Optimized for all screen sizes

## 🎨 Customization

### Update Branding

Edit `download.html`:

```html
<!-- Change title -->
<h1>🚂 Your App Name</h1>

<!-- Change subtitle -->
<p class="subtitle">Download the Mobile App</p>

<!-- Change colors -->
<style>
    /* Primary color */
    --primary: #60a5fa;
    
    /* Background gradient */
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
</style>
```

### Add Custom Instructions

```html
<div class="step">
    <h3>📱 Your Custom Step</h3>
    <ol>
        <li>Your instruction 1</li>
        <li>Your instruction 2</li>
        <li>Your instruction 3</li>
    </ol>
</div>
```

### Change S3 Bucket

Update the configuration in `download.html`:

```javascript
const S3_BUCKET = 'your-bucket-name';
const AWS_REGION = 'your-region';
```

## 🔄 Automatic Updates

### Via GitHub Actions

The download page automatically updates when you:
1. Push new builds via GitHub Actions
2. Builds are uploaded to S3
3. Manifest is updated
4. Download page shows new version

### Manual Update

```bash
# After uploading new builds
./scripts/deploy-download-page.sh
```

## 🔗 Integration Options

### Option 1: Standalone Page

Use as a dedicated download page:
```
https://your-bucket.s3.region.amazonaws.com/
```

### Option 2: Embed in Website

Add an iframe to your existing website:

```html
<iframe 
    src="https://your-bucket.s3.region.amazonaws.com/download.html" 
    width="100%" 
    height="800px" 
    frameborder="0">
</iframe>
```

### Option 3: Link from Website

Add a download button:

```html
<a href="https://your-bucket.s3.region.amazonaws.com/" 
   class="download-button">
    📱 Download Mobile App
</a>
```

### Option 4: Custom Domain

Set up a custom domain:

1. **Create CloudFront Distribution:**
```bash
aws cloudfront create-distribution \
    --origin-domain-name your-bucket.s3.region.amazonaws.com \
    --default-root-object index.html
```

2. **Add CNAME Record:**
```
download.yourdomain.com → CloudFront URL
```

3. **Access via:**
```
https://download.yourdomain.com
```

## 📊 Analytics

### Add Google Analytics

Add to `download.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Track Downloads

Add tracking to download functions:

```javascript
function downloadAndroid() {
    // Track download
    gtag('event', 'download', {
        'event_category': 'Mobile App',
        'event_label': 'Android APK'
    });
    
    // Existing download code...
}
```

## 🔒 Security

### Public Access

The download page requires public read access on S3:

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Ensure it allows public GetObject
```

### Pre-signed URLs

For private buckets, the page uses pre-signed URLs:
- Valid for 30 days
- No authentication required
- Automatically generated

### HTTPS

Use CloudFront for HTTPS:
```bash
# Create distribution with SSL
aws cloudfront create-distribution \
    --origin-domain-name your-bucket.s3.region.amazonaws.com \
    --viewer-protocol-policy redirect-to-https
```

## 🧪 Testing

### Test Locally

```bash
# Serve locally
python3 -m http.server 8000

# Open in browser
http://localhost:8000/download.html
```

### Test on S3

```bash
# Check if page is accessible
curl -I http://your-bucket.s3-website-region.amazonaws.com

# Should return: HTTP/1.1 200 OK
```

### Test Downloads

1. Open download page
2. Click "Download APK"
3. Verify file downloads
4. Check QR code generation

## 📱 Mobile Testing

### Android
1. Open page on Android device
2. Tap "Download APK"
3. Install and test

### iOS
1. Open page on iOS device
2. Tap "Download IPA"
3. Install via TestFlight or AltStore

## 🔄 Maintenance

### Update Page

```bash
# Edit download.html
nano download.html

# Deploy changes
./scripts/deploy-download-page.sh
```

### Monitor Access

```bash
# Enable S3 access logging
aws s3api put-bucket-logging \
    --bucket your-bucket-name \
    --bucket-logging-status '{
        "LoggingEnabled": {
            "TargetBucket": "your-logs-bucket",
            "TargetPrefix": "downloads/"
        }
    }'
```

### Check Statistics

```bash
# View recent downloads
aws s3api list-objects-v2 \
    --bucket your-bucket-name \
    --prefix builds/ \
    --query 'Contents[*].[Key,LastModified,Size]' \
    --output table
```

## 💡 Tips

### Improve Load Time
- Enable CloudFront CDN
- Compress images
- Minify HTML/CSS/JS

### Better SEO
- Add meta tags
- Add Open Graph tags
- Create sitemap

### User Experience
- Add loading animations
- Show download progress
- Add success messages

## 🆘 Troubleshooting

### Page Not Loading

**Check:**
1. Bucket policy allows public read
2. Website hosting is enabled
3. index.html exists in bucket

**Fix:**
```bash
./scripts/deploy-download-page.sh
```

### Builds Not Showing

**Check:**
1. Manifest file exists
2. CORS is configured
3. Builds are uploaded

**Fix:**
```bash
# Check manifest
aws s3 cp s3://your-bucket/manifests/latest.json -

# Upload builds
./scripts/deploy-build.sh
```

### QR Codes Not Working

**Check:**
1. Internet connection
2. QR API is accessible
3. URLs are valid

**Alternative:**
Use a different QR API or generate locally

## 📚 Resources

- [AWS S3 Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [QR Code API](https://goqr.me/api/)

## 🔗 Quick Links

- **S3 Console**: https://s3.console.aws.amazon.com/s3/buckets/expo-builds-239732581050-20251223
- **Download Page**: http://expo-builds-239732581050-20251223.s3-website-eu-north-1.amazonaws.com
- **Manifest**: https://expo-builds-239732581050-20251223.s3.eu-north-1.amazonaws.com/manifests/latest.json

---

**Last Updated**: 2024  
**Maintained by**: Africa Railways Team
