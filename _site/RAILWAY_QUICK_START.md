# 🚂 Railway Quick Start - Deploy OCC Dashboard in 10 Minutes

## ✅ Everything is Ready!

All configuration files have been created and pushed to GitHub. You're ready to deploy!

---

## 🚀 Deploy Now (3 Simple Steps)

### Step 1: Sign Up for Railway (2 minutes)

1. Go to: **https://railway.app**
2. Click **"Login with GitHub"**
3. Authorize Railway (no credit card needed!)

### Step 2: Deploy from GitHub (5 minutes)

1. **Click "New Project"**

2. **Select "Deploy from GitHub repo"**

3. **Choose your repository:**
   - Repository: `mpolobe/africa-railways`
   - Root Directory: `dashboard`

4. **Railway will auto-detect:**
   - ✅ Go 1.22 application
   - ✅ Build command: `go build -o occ-dashboard main.go`
   - ✅ Start command: `./occ-dashboard`
   - ✅ Port: 8080

5. **Add Environment Variables:**
   - Click "Variables" tab
   - Add these 3 variables:

   ```
   RELAYER_PRIVATE_KEY=e4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
   ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   PORT=8080
   ```

6. **Click "Deploy"**
   - Wait 2-3 minutes for build
   - Watch the logs
   - Look for "Deployment successful"

### Step 3: Add Custom Domain (3 minutes)

1. **Get your Railway URL:**
   - Example: `https://occ-dashboard-production.up.railway.app`
   - Test it - it should work!

2. **Add Custom Domain:**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter: `occ.africarailways.com`

3. **Copy DNS Records:**
   - Railway will show:
     ```
     Type: CNAME
     Name: occ
     Value: occ-dashboard-production.up.railway.app
     ```

4. **Update Your DNS:**
   - Go to your domain registrar (Namecheap, GoDaddy, etc.)
   - Add the CNAME record
   - Wait 5-30 minutes for DNS propagation

5. **Done!** 🎉
   - Your OCC Dashboard will be live at: `https://occ.africarailways.com`

---

## 📋 Quick Checklist

- [ ] Sign up for Railway with GitHub
- [ ] Create new project from `mpolobe/africa-railways`
- [ ] Set root directory to `dashboard`
- [ ] Add 3 environment variables
- [ ] Deploy and wait for build
- [ ] Test Railway URL
- [ ] Add custom domain `occ.africarailways.com`
- [ ] Update DNS records
- [ ] Wait for DNS propagation
- [ ] Test custom domain
- [ ] Update website (already done!)

---

## ✅ What's Already Done

✅ **Configuration Files Created:**
- `railway.toml` - Railway configuration
- `Dockerfile` - Container setup
- `.railwayignore` - Files to ignore
- `railway.json` - Build settings

✅ **Website Updated:**
- All OCC Dashboard links now point to `occ.africarailways.com`
- Navigation menu updated
- Footer links updated
- Hero section button updated

✅ **Pushed to GitHub:**
- All changes committed
- Ready for Railway to deploy

---

## 🔍 Verify Deployment

### Test Railway URL First

```bash
# Test health endpoint
curl https://occ-dashboard-production.up.railway.app/api/health

# Test metrics
curl https://occ-dashboard-production.up.railway.app/api/metrics | jq '.wallet'
```

### Test Custom Domain (After DNS)

```bash
# Test health
curl https://occ.africarailways.com/api/health

# Test metrics
curl https://occ.africarailways.com/api/metrics | jq '.wallet'

# Check SSL
curl -I https://occ.africarailways.com
```

---

## 💰 Cost

**Free Tier:**
- $5 credit per month
- OCC Dashboard uses ~$3-5/month
- **Total: $0/month** (within free tier!)

---

## 🆘 Need Help?

### Common Issues

**Build fails?**
- Check that root directory is set to `dashboard`
- Verify environment variables are set

**Domain not working?**
- Wait for DNS propagation (can take up to 48 hours)
- Check DNS records are correct
- Use `dig occ.africarailways.com` to verify

**Environment variables not loading?**
- Re-enter them in Railway dashboard
- Click "Redeploy" after adding variables

---

## 📚 Full Documentation

For detailed instructions, see:
- **RAILWAY_DEPLOYMENT_GUIDE.md** - Complete guide
- **OCC_HOSTING_COMPARISON.md** - Compare hosting options
- **DEPLOYMENT_STATUS.md** - Current deployment status

---

## 🎯 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Verify wallet balance shows
3. ✅ Check blockchain connection
4. ✅ Enable auto-deploy from GitHub
5. ✅ Set up monitoring alerts
6. ✅ Share your live dashboard!

---

## 🌐 Your Live URLs

**Main Website (Vercel):**
```
https://africa-railways.vercel.app
```

**OCC Dashboard (Railway):**
```
https://occ.africarailways.com
```

**Temporary Dev (Gitpod):**
```
https://8080--019b4edd-6fb5-72c3-bce9-ad11fda70f5f.eu-central-1-01.gitpod.dev
```

---

## 🎉 You're All Set!

Everything is configured and ready. Just follow the 3 steps above to deploy!

**Time Required:** 10 minutes  
**Cost:** $0/month  
**Difficulty:** Easy ⭐⭐

**Ready? Go to https://railway.app and start deploying!** 🚀
