# EAS Workflows

Native EAS workflow configurations for automated mobile app builds and submissions.

## Workflows

### 1. Create Production Builds
**File**: `create-production-builds.yml`

**Trigger**: Push to `main` branch

**What it does**:
- Builds Android production APK/AAB
- Builds iOS production IPA
- Runs in parallel for faster completion

**Usage**: Automatically triggers on every push to main.

---

### 2. Create Preview Builds
**File**: `create-preview-builds.yml`

**Trigger**: Pull request opened or updated

**What it does**:
- Builds Android preview version
- Builds iOS preview version
- Perfect for testing before merging

**Usage**: Automatically triggers on PR creation/update.

---

### 3. Submit to App Stores
**File**: `submit-to-stores.yml`

**Trigger**: Manual workflow dispatch

**What it does**:
- Submits latest build to Google Play Store
- Submits latest build to Apple App Store
- Choose platform: android, ios, or all

**Usage**: 
1. Go to Expo dashboard
2. Navigate to Workflows
3. Select "Submit to App Stores"
4. Choose platform
5. Run workflow

---

## Configuration

These workflows use the profiles defined in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Monitoring

### View Workflow Runs
- **Expo Dashboard**: https://expo.dev/accounts/mpolobe/projects/africa-railways/workflows
- **Build History**: https://expo.dev/accounts/mpolobe/projects/africa-railways/builds

### Check Build Status
```bash
eas build:list
```

### View Workflow Logs
```bash
eas workflow:view [WORKFLOW_ID]
```

---

## Advantages of EAS Workflows

✅ **Native Integration**: Built into EAS, no GitHub Actions needed  
✅ **Parallel Builds**: Android and iOS build simultaneously  
✅ **Auto-versioning**: Automatic version increments  
✅ **Store Submission**: Direct submission to app stores  
✅ **Build Caching**: Faster subsequent builds  
✅ **Credentials Management**: Secure credential handling  

---

## Comparison: EAS Workflows vs GitHub Actions

| Feature | EAS Workflows | GitHub Actions |
|---------|---------------|----------------|
| Setup | Minimal config | More complex |
| Build Speed | Optimized for mobile | General purpose |
| Credentials | Managed by EAS | Manual setup |
| Store Submission | Built-in | Requires extra steps |
| Cost | EAS pricing | GitHub minutes |
| Monitoring | Expo dashboard | GitHub UI |

**Recommendation**: Use EAS Workflows for mobile builds, GitHub Actions for backend/frontend.

---

## Troubleshooting

### Workflow Not Triggering

**Check**:
1. Workflow file syntax is correct
2. Branch name matches trigger
3. EAS project is properly configured

**Fix**:
```bash
# Validate workflow
eas workflow:validate

# Re-sync workflows
eas workflow:sync
```

### Build Failing

**Check logs**:
```bash
eas build:view [BUILD_ID]
```

**Common issues**:
- Missing credentials
- Invalid bundle identifier
- Dependency conflicts
- Insufficient build resources

### Credentials Issues

**Reset credentials**:
```bash
eas credentials:reset
```

**Configure credentials**:
```bash
eas credentials
```

---

## Best Practices

1. **Use preview builds for testing**: Don't push untested code to production
2. **Monitor build queue**: Check dashboard for build status
3. **Version control**: Let EAS auto-increment versions
4. **Test on devices**: Use internal distribution for testing
5. **Store submission**: Only submit thoroughly tested builds

---

## Additional Resources

- [EAS Workflows Documentation](https://docs.expo.dev/eas/workflows/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

---

**Built for Africa, By Africa** 🌍📱
