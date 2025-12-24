# 🌐 OCC Dashboard Hosting Comparison

## Overview

Comparing hosting options for the OCC Dashboard Go application with subdomain `occ.africarailways.com`.

---

## 📊 Quick Comparison

| Feature | Railway | Google Cloud Run | AWS App Runner | Render | Fly.io |
|---------|---------|------------------|----------------|--------|--------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Free Tier** | $5 credit/month | $0 (pay-as-go) | $0 (pay-as-go) | 750 hrs/month | 3 VMs free |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free | ✅ Free | ✅ Free |
| **Auto SSL** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto Deploy** | ✅ GitHub | ✅ GitHub | ✅ GitHub | ✅ GitHub | ✅ GitHub |
| **WebSocket** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Setup Time** | 5 min | 15 min | 15 min | 5 min | 10 min |
| **Monthly Cost** | $0-5 | $0-10 | $5-15 | $0-7 | $0-5 |
| **Best For** | Startups | Enterprise | AWS users | Developers | Global edge |

---

## 🏆 Recommendation: Railway.app

**Why Railway is Best for You:**

✅ **Easiest Setup** - Deploy in 5 minutes  
✅ **Free Tier** - $5 credit/month (enough for OCC dashboard)  
✅ **GitHub Integration** - Auto-deploy on push  
✅ **Custom Domain** - Easy subdomain setup  
✅ **Environment Variables** - Secure secret management  
✅ **No Credit Card Required** - Start free  
✅ **Perfect for Go** - Native Go support  

---

## 🚀 Option 1: Railway.app (RECOMMENDED)

### Pros
- ✅ Simplest deployment process
- ✅ Free $5 credit per month
- ✅ Automatic HTTPS
- ✅ GitHub auto-deploy
- ✅ Built-in monitoring
- ✅ No credit card needed to start
- ✅ Perfect for Go applications

### Cons
- ⚠️ $5/month after free credit (still very cheap)
- ⚠️ Limited to Railway infrastructure

### Cost Estimate
```
Free Tier: $5 credit/month
OCC Dashboard usage: ~$3-5/month
Total: $0-5/month
```

### Setup Steps

1. **Sign up for Railway**
   ```
   https://railway.app
   ```

2. **Deploy from GitHub**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Link to GitHub repo
   railway link
   
   # Deploy dashboard
   cd dashboard
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set RELAYER_PRIVATE_KEY=your_key_here
   railway variables set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   ```

4. **Add Custom Domain**
   ```bash
   railway domain add occ.africarailways.com
   ```

5. **Update DNS**
   ```
   Type: CNAME
   Name: occ
   Value: [provided by Railway]
   TTL: 3600
   ```

### Files Already Created
- ✅ `railway.toml` - Configuration
- ✅ `railway.json` - Build settings
- ✅ `Dockerfile` - Container config
- ✅ `.railwayignore` - Ignore rules

---

## ☁️ Option 2: Google Cloud Run

### Pros
- ✅ Serverless (pay only for requests)
- ✅ Auto-scaling
- ✅ Google's infrastructure
- ✅ Free tier: 2 million requests/month
- ✅ Global deployment

### Cons
- ⚠️ More complex setup
- ⚠️ Requires Google Cloud account
- ⚠️ Credit card required
- ⚠️ Cold starts (slower first request)

### Cost Estimate
```
Free Tier: 2M requests/month
OCC Dashboard: ~100K requests/month
Total: $0-5/month
```

### Setup Steps

1. **Install Google Cloud SDK**
   ```bash
   curl https://sdk.cloud.google.com | bash
   gcloud init
   ```

2. **Create Project**
   ```bash
   gcloud projects create africa-railways-occ
   gcloud config set project africa-railways-occ
   ```

3. **Enable Cloud Run**
   ```bash
   gcloud services enable run.googleapis.com
   ```

4. **Build and Deploy**
   ```bash
   cd dashboard
   
   # Build container
   gcloud builds submit --tag gcr.io/africa-railways-occ/occ-dashboard
   
   # Deploy to Cloud Run
   gcloud run deploy occ-dashboard \
     --image gcr.io/africa-railways-occ/occ-dashboard \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars RELAYER_PRIVATE_KEY=your_key,ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
   ```

5. **Add Custom Domain**
   ```bash
   gcloud run domain-mappings create \
     --service occ-dashboard \
     --domain occ.africarailways.com \
     --region us-central1
   ```

### Files Needed
```dockerfile
# Already created: Dockerfile
```

---

## 🔶 Option 3: AWS App Runner

### Pros
- ✅ Fully managed
- ✅ Auto-scaling
- ✅ AWS integration
- ✅ Good for existing AWS users

### Cons
- ⚠️ More expensive than Railway
- ⚠️ Complex AWS setup
- ⚠️ Credit card required
- ⚠️ Steeper learning curve

### Cost Estimate
```
Base: $5/month (always running)
Compute: $0.064/vCPU-hour
Memory: $0.007/GB-hour
Total: ~$10-15/month
```

### Setup Steps

1. **Install AWS CLI**
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS**
   ```bash
   aws configure
   ```

3. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name occ-dashboard
   ```

4. **Build and Push Image**
   ```bash
   cd dashboard
   
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin \
     [account-id].dkr.ecr.us-east-1.amazonaws.com
   
   # Build
   docker build -t occ-dashboard .
   
   # Tag
   docker tag occ-dashboard:latest \
     [account-id].dkr.ecr.us-east-1.amazonaws.com/occ-dashboard:latest
   
   # Push
   docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/occ-dashboard:latest
   ```

5. **Create App Runner Service**
   ```bash
   aws apprunner create-service \
     --service-name occ-dashboard \
     --source-configuration '{
       "ImageRepository": {
         "ImageIdentifier": "[account-id].dkr.ecr.us-east-1.amazonaws.com/occ-dashboard:latest",
         "ImageRepositoryType": "ECR"
       }
     }' \
     --instance-configuration '{
       "Cpu": "1 vCPU",
       "Memory": "2 GB"
     }'
   ```

6. **Add Custom Domain**
   - Go to AWS App Runner console
   - Select your service
   - Add custom domain: occ.africarailways.com
   - Update DNS with provided records

---

## 🎯 Detailed Comparison

### Railway vs Google Cloud Run vs AWS

| Aspect | Railway | Google Cloud Run | AWS App Runner |
|--------|---------|------------------|----------------|
| **Setup Complexity** | Very Easy | Medium | Medium-Hard |
| **Time to Deploy** | 5 minutes | 15 minutes | 20 minutes |
| **Free Tier** | $5 credit | 2M requests | None |
| **Monthly Cost** | $0-5 | $0-10 | $10-15 |
| **Auto-Deploy** | ✅ Built-in | ⚠️ Need CI/CD | ⚠️ Need CI/CD |
| **Custom Domain** | ✅ Easy | ✅ Easy | ✅ Medium |
| **Environment Vars** | ✅ Dashboard | ✅ CLI/Console | ✅ Console |
| **Monitoring** | ✅ Built-in | ✅ Cloud Monitoring | ✅ CloudWatch |
| **Logs** | ✅ Real-time | ✅ Cloud Logging | ✅ CloudWatch |
| **Scaling** | ✅ Auto | ✅ Auto | ✅ Auto |
| **WebSocket** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Best For** | Startups | Google users | AWS users |

---

## 💰 Cost Breakdown (Monthly)

### Railway
```
Base: $0 (free tier)
Usage: ~$3-5
Total: $0-5/month
```

### Google Cloud Run
```
Requests: $0 (under 2M)
Compute: ~$2-5
Storage: ~$1
Total: $0-10/month
```

### AWS App Runner
```
Base: $5 (always running)
Compute: ~$5
Memory: ~$3
Total: ~$10-15/month
```

---

## 🏆 Final Recommendation

### For Your Use Case: **Railway.app**

**Why?**

1. **Fastest Setup** - Deploy in 5 minutes
2. **Cheapest** - $0-5/month (vs $10-15 for AWS)
3. **Easiest** - No complex cloud configuration
4. **Perfect for Go** - Native support
5. **Auto-Deploy** - Push to GitHub = auto-deploy
6. **Free to Start** - No credit card needed

### When to Use Others

**Use Google Cloud Run if:**
- You're already using Google Cloud
- You need serverless architecture
- You want pay-per-request pricing

**Use AWS App Runner if:**
- You're already using AWS
- You need AWS integrations (RDS, S3, etc.)
- Your company requires AWS

---

## 🚀 Quick Start with Railway (5 Minutes)

### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Deploy
```bash
cd /workspaces/africa-railways/dashboard
railway init
railway up
```

### Step 4: Set Environment Variables
```bash
railway variables set RELAYER_PRIVATE_KEY=e4cbd7171db39d6d336b6555e0e1eec1c2da2cbc5ddc4a90c4acf61904552c56
railway variables set ALCHEMY_API_KEY=4-gxorN-H4MhqZWrskRQ-
```

### Step 5: Add Custom Domain
```bash
railway domain add occ.africarailways.com
```

### Step 6: Update DNS
Railway will provide a CNAME record. Add it to your domain:
```
Type: CNAME
Name: occ
Value: [provided by Railway]
```

**Done!** Your OCC Dashboard is live at `https://occ.africarailways.com`

---

## 📋 Deployment Checklist

### Railway (Recommended)
- [ ] Sign up for Railway
- [ ] Install Railway CLI
- [ ] Deploy from dashboard directory
- [ ] Set environment variables
- [ ] Add custom domain
- [ ] Update DNS records
- [ ] Test deployment

### Google Cloud Run (Alternative)
- [ ] Create Google Cloud account
- [ ] Install gcloud CLI
- [ ] Create project
- [ ] Enable Cloud Run API
- [ ] Build container
- [ ] Deploy to Cloud Run
- [ ] Add custom domain
- [ ] Update DNS records

### AWS App Runner (Alternative)
- [ ] Create AWS account
- [ ] Install AWS CLI
- [ ] Create ECR repository
- [ ] Build and push Docker image
- [ ] Create App Runner service
- [ ] Add custom domain
- [ ] Update DNS records

---

## 🎯 Summary

**Best Choice: Railway.app**

| Criteria | Railway | Google Cloud | AWS |
|----------|---------|--------------|-----|
| Ease | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Cost | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Features | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recommendation:** Start with Railway. You can always migrate to Google Cloud or AWS later if needed.

---

## 📞 Next Steps

**Ready to deploy?**

1. Choose Railway (recommended)
2. Follow the 5-minute quick start above
3. Your OCC Dashboard will be live at `occ.africarailways.com`

**Need help?** I can:
- Create deployment scripts
- Set up CI/CD pipeline
- Configure monitoring
- Help with DNS setup

---

**Let me know which option you prefer, and I'll help you deploy!**
