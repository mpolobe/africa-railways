# 🚂 Sovereign Hub Deployment Guide

One-command deployment for the Africa Railways Digital Spine.

## Quick Start

```bash
./deploy-sovereign.sh
```

That's it! The script handles everything automatically.

---

## What It Does

The deployment script performs the following steps:

### 1. Environment Validation
- Detects environment (Gitpod, Codespaces, or Local)
- Validates project structure
- Checks working directory

### 2. Dependency Checks
- ✅ Go (required)
- ✅ Node.js (optional)
- ✅ Git (optional)
- ✅ WebSocket package (`github.com/gorilla/websocket`)

### 3. Credential Validation
Checks for SMS provider credentials:

**Required (Twilio):**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`

**Optional (Africa's Talking - Fallback):**
- `AT_API_KEY`
- `AT_USERNAME`

If credentials are missing, the system continues without SMS features.

### 4. Backend Build
- Compiles Go backend to `bin/sovereign-engine`
- Validates all handlers and dependencies
- Creates optimized binary

### 5. Service Startup
- **Backend**: Starts on port `8080`
- **Frontend**: Starts on port `8082`
- Performs health checks
- Logs to `logs/sovereign_engine.log`

### 6. Status Report
Displays access URLs and service status.

---

## Configuration

Edit these variables at the top of `deploy-sovereign.sh`:

```bash
PORT_BACKEND=8080      # Backend API port
PORT_FRONTEND=8082     # Frontend dashboard port
LOG_FILE="logs/sovereign_engine.log"
```

---

## Access Points

After deployment, access your services:

### Local Development
- 📱 **Dashboard**: http://localhost:8082/dashboard.html
- 🏠 **Home Page**: http://localhost:8082/index.html
- 📡 **Live Feed**: http://localhost:8082/live-feed.html
- 🎮 **iPad Control**: http://localhost:8082/ipad-control-center.html
- 🔧 **Backend API**: http://localhost:8080

### Gitpod
URLs are automatically generated using `gp url` command.

### GitHub Codespaces
URLs use the Codespaces port forwarding domain.

---

## iPad Setup

### Quick Access with QR Code

The deployment script automatically generates a QR code for instant iPad access:

1. Run `./deploy-sovereign.sh`
2. **Scan the QR code** displayed in the terminal with your iPad camera
3. Tap the notification to open Safari
4. Tap the **Share** button
5. Select **Add to Home Screen**
6. Name it "Sovereign Hub"
7. Tap **Add**

Now you have a native-like app icon on your iPad!

### Manual Setup

If QR code scanning isn't available:

1. Copy the Dashboard URL from the deployment output
2. Open Safari on your iPad
3. Paste the URL and navigate
4. Follow steps 4-7 above

### QR Code Requirements

The QR code feature requires `qrencode`:

```bash
# Install on Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y qrencode

# Install on macOS
brew install qrencode
```

This is automatically available in Gitpod and Codespaces environments.

---

## Monitoring

### View Logs

**Backend logs:**
```bash
tail -f logs/sovereign_engine.log
```

**Frontend logs:**
```bash
tail -f logs/frontend.log
```

### Check Service Status

```bash
# Backend
curl http://localhost:8080/health

# Check if services are running
ps aux | grep sovereign-engine
ps aux | grep "http.server"
```

---

## Stopping Services

### Stop Backend
```bash
kill $(cat logs/backend.pid)
```

### Stop Frontend
```bash
kill $(cat logs/frontend.pid)
```

### Stop All
```bash
kill $(cat logs/backend.pid) $(cat logs/frontend.pid)
```

Or use `fuser`:
```bash
fuser -k 8080/tcp 8082/tcp
```

---

## Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
cat logs/sovereign_engine.log
```

**Common issues:**
- Port 8080 already in use
- Missing Go dependencies
- Compilation errors

**Solution:**
```bash
# Kill existing process
fuser -k 8080/tcp

# Rebuild
cd backend && go build -o ../bin/sovereign-engine .
```

### Frontend Won't Start

**Check if Python is installed:**
```bash
python3 --version
```

**Alternative: Use PHP**
```bash
php -S 0.0.0.0:8082
```

**Or open files directly:**
Just open `dashboard.html` in your browser.

### QR Code Not Displaying

**Check if qrencode is installed:**
```bash
qrencode --version
```

**Install if missing:**
```bash
# Ubuntu/Debian
sudo apt-get install -y qrencode

# macOS
brew install qrencode
```

**Manual alternative:**
Copy the URL and use an online QR generator like [qr-code-generator.com](https://www.qr-code-generator.com/)

### SMS Not Working

**Check credentials:**
```bash
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
```

**Configure Twilio:**
```bash
./setup-twilio.sh
```

### Port Already in Use

**Find and kill process:**
```bash
# Find process
lsof -i :8080
lsof -i :8082

# Kill process
kill -9 <PID>
```

---

## Environment Variables

Create `backend/.env` with:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Africa's Talking (Optional)
AT_USERNAME=sandbox
AT_API_KEY=your_api_key_here

# SMS Provider Selection
SMS_PROVIDER=twilio
```

---

## Development Workflow

### 1. Make Changes
Edit files in `backend/` or frontend HTML files.

### 2. Redeploy
```bash
./deploy-sovereign.sh
```

The script automatically:
- Rebuilds the backend
- Restarts services
- Validates changes

### 3. Test
Open the dashboard and verify changes.

---

## Production Deployment

For production environments:

### 1. Set Environment Variables
```bash
export TWILIO_ACCOUNT_SID="your_production_sid"
export TWILIO_AUTH_TOKEN="your_production_token"
export TWILIO_MESSAGING_SERVICE_SID="your_production_service_sid"
```

### 2. Build Optimized Binary
```bash
cd backend
go build -ldflags="-s -w" -o ../bin/sovereign-engine .
```

### 3. Use Process Manager
```bash
# Using systemd
sudo systemctl start sovereign-hub

# Or PM2 (Node.js)
pm2 start ./bin/sovereign-engine --name sovereign-backend
pm2 start "python3 -m http.server 8082" --name sovereign-frontend
```

### 4. Configure Reverse Proxy
Use Nginx or Caddy to proxy requests:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8082;
    }

    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS in production
- [ ] Restrict CORS origins
- [ ] Use firewall rules for port access
- [ ] Rotate API keys regularly
- [ ] Monitor logs for suspicious activity

---

## Support

For issues or questions:
- Check logs: `logs/sovereign_engine.log`
- Review troubleshooting section above
- Contact: ben.mpolokoso@gmail.com

---

**Built for Africa, By Africa** 🌍
