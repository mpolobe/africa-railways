# Gitpod Integration

## Add to README.md

Add this badge to your main README.md file:

### Markdown Badge
```markdown
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/mpolobe/africa-railways)
```

### HTML Badge
```html
<a href="https://gitpod.io/#https://github.com/mpolobe/africa-railways">
  <img src="https://gitpod.io/button/open-in-gitpod.svg" alt="Open in Gitpod">
</a>
```

### Custom Badge with Styling
```markdown
[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/mpolobe/africa-railways)
```

## Direct Links

### Open Workspace
```
https://gitpod.io/#https://github.com/mpolobe/africa-railways
```

### Open Specific Branch
```
https://gitpod.io/#https://github.com/mpolobe/africa-railways/tree/fix/wallet-race-condition-bug
```

### Open with Prebuild
```
https://gitpod.io/#prebuild/https://github.com/mpolobe/africa-railways
```

## Example README Section

Add this section to your README.md:

```markdown
## 🚀 Quick Start with Gitpod

Develop and build mobile apps in the cloud with zero local setup:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/mpolobe/africa-railways)

### What's Included
- ✅ Node.js 18 + Java 17
- ✅ Android SDK pre-configured
- ✅ EAS CLI + Expo CLI
- ✅ AWS CLI for S3 deployment
- ✅ All dependencies pre-installed

### First Time Setup (5 minutes)
1. Click the Gitpod button above
2. Run: `./scripts/setup-s3-gitpod.sh` (configure AWS)
3. Run: `eas login` (login to Expo)
4. Run: `./scripts/deploy-build.sh` (build & deploy)

See [README-Gitpod.md](./README-Gitpod.md) for complete documentation.
```

## Gitpod Configuration Files

Your repository now includes:

### `.gitpod.yml`
- Workspace configuration
- Port settings
- Startup tasks
- VS Code extensions

### `.gitpod.Dockerfile`
- Custom Docker image
- Pre-installed tools
- Environment setup

### `README-Gitpod.md`
- Complete documentation
- Setup instructions
- Troubleshooting guide

## Features

### Pre-configured Environment
- Node.js 18
- Java 17 (for Android)
- Android SDK
- EAS CLI
- Expo CLI
- AWS CLI v2
- AWS SAM CLI

### Automatic Setup
- Dependencies installed on workspace start
- Helpful command suggestions
- Pre-configured ports
- VS Code extensions

### Build & Deploy
- Build Android/iOS apps
- Deploy to AWS S3
- Generate download URLs
- Share with testers

## Usage Examples

### Open in Gitpod
```bash
# Direct URL
https://gitpod.io/#https://github.com/mpolobe/africa-railways

# With context
https://gitpod.io/#context=https://github.com/mpolobe/africa-railways
```

### Environment Variables
Set environment variables for all workspaces:

```bash
# In Gitpod workspace
gp env EXPO_TOKEN=your_token_here
gp env AWS_ACCESS_KEY_ID=your_key
gp env AWS_SECRET_ACCESS_KEY=your_secret
```

### Share Snapshot
Share your workspace state:

```bash
# Create snapshot
gp snapshot

# Share the generated URL with team members
```

## Benefits

### For Developers
- ✅ No local setup required
- ✅ Consistent environment
- ✅ Fast workspace startup
- ✅ Work from any device
- ✅ Easy collaboration

### For Teams
- ✅ Standardized development environment
- ✅ Faster onboarding
- ✅ Reproducible builds
- ✅ Easy code reviews
- ✅ Pair programming support

### For CI/CD
- ✅ Same environment as production
- ✅ Pre-configured tools
- ✅ Automated testing
- ✅ Easy deployment
- ✅ Cost-effective

## Cost

### Gitpod Pricing
- **Free**: 50 hours/month
- **Personal**: $9/month (100 hours)
- **Professional**: $39/month (unlimited)

### AWS S3 Pricing
- **Storage**: ~$0.023/GB/month
- **Transfer**: First 100GB free
- **Typical Cost**: $1-5/month

### Total Estimate
- **Development**: $0-10/month
- **Production**: $10-50/month

## Support

### Documentation
- [Gitpod Docs](https://www.gitpod.io/docs)
- [README-Gitpod.md](./README-Gitpod.md)
- [EAS Build Setup](./EAS_BUILD_SETUP.md)

### Community
- [Gitpod Community](https://www.gitpod.io/community)
- [Expo Forums](https://forums.expo.dev/)
- [GitHub Issues](https://github.com/mpolobe/africa-railways/issues)

## Tips

### Speed Up Workspace Start
- Enable prebuilds in `.gitpod.yml`
- Minimize dependencies
- Use Docker layer caching

### Persist Data
```bash
# Save to workspace
echo "data" > /workspace/file.txt

# Save to environment
gp env MY_VAR=value
```

### Debug Issues
```bash
# Check logs
gp tasks list
gp tasks logs

# Restart task
gp tasks restart
```

---

**Ready to start?** Click the Gitpod button and start building in seconds!
