# Self-Hosted GitHub Actions Runner Setup

Complete guide for setting up self-hosted runners to build mobile apps without EAS cloud build limits.

## Why Self-Hosted Runners?

### Benefits
- **Unlimited Builds**: No monthly build limits
- **Faster Builds**: Use your own powerful hardware
- **Cost Savings**: No EAS subscription needed for builds
- **Full Control**: Complete control over build environment
- **Private Network**: Build on your own infrastructure
- **Custom Tools**: Install any tools you need

### Considerations
- **Maintenance**: You manage the infrastructure
- **Security**: Ensure proper isolation and security
- **Availability**: You're responsible for uptime
- **Resources**: Need sufficient CPU, RAM, and disk space

## Prerequisites

### Hardware Requirements

#### For Android Builds
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 50GB free space minimum
- **OS**: Ubuntu 20.04+, macOS, or Windows

#### For iOS Builds (Additional)
- **macOS**: Required (macOS 12+ recommended)
- **Xcode**: Latest version installed
- **Apple Developer Account**: For signing

### Software Requirements
- Git
- Node.js 18+
- Java JDK 17+ (for Android)
- Android SDK (for Android)
- Xcode (for iOS, macOS only)

## Setup Instructions

### Step 1: Prepare Your Machine

#### Ubuntu/Debian
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17
sudo apt-get install -y openjdk-17-jdk

# Install build tools
sudo apt-get install -y build-essential git curl

# Verify installations
node --version
java --version
git --version
```

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install Java
brew install openjdk@17

# Install Xcode (for iOS)
# Download from App Store or:
xcode-select --install

# Verify installations
node --version
java --version
xcodebuild -version
```

### Step 2: Add Self-Hosted Runner to GitHub

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click "Settings" → "Actions" → "Runners"
   - Click "New self-hosted runner"

2. **Choose Your OS**
   - Select your operating system (Linux, macOS, or Windows)
   - Follow the download and configuration instructions

3. **Download Runner**
   ```bash
   # Create a folder
   mkdir actions-runner && cd actions-runner
   
   # Download the latest runner package
   curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
     https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
   
   # Extract the installer
   tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
   ```

4. **Configure Runner**
   ```bash
   # Create the runner and start the configuration
   ./config.sh --url https://github.com/YOUR_USERNAME/africa-railways \
     --token YOUR_REGISTRATION_TOKEN
   
   # When prompted:
   # - Enter runner name (e.g., "build-server-1")
   # - Enter runner group (press Enter for default)
   # - Enter labels (e.g., "android,linux,self-hosted")
   # - Enter work folder (press Enter for default)
   ```

5. **Start Runner**
   ```bash
   # Run interactively (for testing)
   ./run.sh
   
   # Or install as a service (recommended for production)
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### Step 3: Install Build Dependencies

#### Android SDK Setup
```bash
# Download Android command line tools
cd ~
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip -d android-sdk

# Set environment variables
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# Accept licenses
yes | sdkmanager --licenses

# Install required packages
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

#### EAS CLI Setup
```bash
# Install globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Step 4: Configure Secrets

1. **Create Expo Access Token**
   - Go to https://expo.dev/accounts/[username]/settings/access-tokens
   - Click "Create Token"
   - Name it "Self-Hosted Runner"
   - Copy the token

2. **Add to GitHub Secrets**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EXPO_TOKEN`
   - Value: Paste your token
   - Click "Add secret"

### Step 5: Test the Setup

1. **Trigger a Build**
   - Go to Actions tab in GitHub
   - Select "Self-Hosted Build" workflow
   - Click "Run workflow"
   - Select platform and profile
   - Click "Run workflow"

2. **Monitor the Build**
   - Watch the workflow run in real-time
   - Check for any errors
   - Verify the build completes successfully

3. **Download the Build**
   - Once complete, download from Artifacts
   - Or use the transfer.sh link (if available)

## Runner Management

### Check Runner Status
```bash
# If running as service
sudo ./svc.sh status

# View logs
sudo journalctl -u actions.runner.* -f
```

### Stop Runner
```bash
# If running as service
sudo ./svc.sh stop

# If running interactively
# Press Ctrl+C
```

### Restart Runner
```bash
sudo ./svc.sh restart
```

### Update Runner
```bash
# Stop the runner
sudo ./svc.sh stop

# Download new version
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Start the runner
sudo ./svc.sh start
```

### Remove Runner
```bash
# Stop and uninstall service
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remove from GitHub
./config.sh remove --token YOUR_REMOVAL_TOKEN
```

## Security Best Practices

### 1. Isolate the Runner
- Run in a dedicated VM or container
- Use separate user account
- Limit network access

### 2. Secure Credentials
- Never commit tokens to git
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly

### 3. Monitor Activity
- Review workflow logs regularly
- Set up alerts for failures
- Monitor resource usage

### 4. Keep Updated
- Update runner regularly
- Keep OS and dependencies patched
- Update Node.js and Java

### 5. Limit Permissions
- Use least privilege principle
- Don't run as root
- Restrict file system access

## Troubleshooting

### Runner Not Connecting
```bash
# Check network connectivity
ping github.com

# Check runner logs
sudo journalctl -u actions.runner.* -n 50

# Restart runner
sudo ./svc.sh restart
```

### Build Fails: Java Not Found
```bash
# Verify Java installation
java --version

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
```

### Build Fails: Android SDK Not Found
```bash
# Verify ANDROID_HOME
echo $ANDROID_HOME

# Set if missing
export ANDROID_HOME=$HOME/android-sdk
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
source ~/.bashrc
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean old builds
cd ~/actions-runner/_work/africa-railways/africa-railways/build
ls -t *.apk | tail -n +6 | xargs rm

# Clean Docker (if using)
docker system prune -a
```

### Build Takes Too Long
- Increase CPU cores
- Add more RAM
- Use SSD instead of HDD
- Enable build caching

## Advanced Configuration

### Multiple Runners
Run multiple runners for parallel builds:

```bash
# Create separate directories
mkdir actions-runner-1 actions-runner-2

# Configure each with different names
cd actions-runner-1
./config.sh --url ... --name "build-server-1"

cd ../actions-runner-2
./config.sh --url ... --name "build-server-2"

# Start both
cd actions-runner-1 && sudo ./svc.sh install && sudo ./svc.sh start
cd actions-runner-2 && sudo ./svc.sh install && sudo ./svc.sh start
```

### Docker-Based Runner
```dockerfile
# Dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl git build-essential \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install EAS CLI
RUN npm install -g eas-cli

# Add runner user
RUN useradd -m -s /bin/bash runner

USER runner
WORKDIR /home/runner

# Download and configure runner
# (Add runner setup commands here)
```

### Build Caching
Enable caching to speed up builds:

```yaml
# In workflow file
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    
- name: Cache Gradle
  uses: actions/cache@v3
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}
```

## Monitoring and Maintenance

### Daily Tasks
- Check runner status
- Review build logs
- Monitor disk space

### Weekly Tasks
- Clean old builds
- Review security logs
- Check for updates

### Monthly Tasks
- Update runner software
- Update OS and dependencies
- Review and rotate credentials
- Audit access logs

## Cost Analysis

### Self-Hosted vs EAS Cloud

#### Self-Hosted (Example)
- **Hardware**: $50-200/month (VPS or dedicated)
- **Maintenance**: 2-4 hours/month
- **Builds**: Unlimited
- **Total**: ~$50-200/month + time

#### EAS Cloud
- **Free Tier**: 30 builds/month
- **Production**: $29/month (unlimited builds)
- **Priority**: $99/month (faster builds)
- **Maintenance**: None

### When to Use Self-Hosted
- Building more than 30 times/month
- Need faster builds than EAS offers
- Have existing infrastructure
- Want full control
- Building very large apps

### When to Use EAS Cloud
- Building less than 30 times/month
- Don't want to manage infrastructure
- Need iOS builds without macOS
- Want zero maintenance
- Small team or solo developer

## Resources

- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android SDK Command Line Tools](https://developer.android.com/studio/command-line)
- [Xcode Command Line Tools](https://developer.apple.com/xcode/)

## Support

For issues with:
- **Runner Setup**: Check GitHub Actions documentation
- **Build Failures**: Review workflow logs and EAS documentation
- **Infrastructure**: Consult your hosting provider

## Quick Reference

```bash
# Start runner
sudo ./svc.sh start

# Stop runner
sudo ./svc.sh stop

# Check status
sudo ./svc.sh status

# View logs
sudo journalctl -u actions.runner.* -f

# Update runner
sudo ./svc.sh stop
# Download new version
sudo ./svc.sh start

# Clean builds
rm -rf ~/actions-runner/_work/*/*/build/*.apk
```

---

**Last Updated:** 2024  
**Maintained by:** Africa Railways Team
