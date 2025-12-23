#!/bin/bash
# check-token-security.sh
# Comprehensive security scanner for exposed credentials and tokens

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Security Token Scanner${NC}"
echo "=================================="
echo ""

ISSUES_FOUND=0

# Patterns to search for
declare -A PATTERNS=(
    ["Expo Token"]="exp[0-9a-zA-Z]{40,}"
    ["AWS Access Key"]="AKIA[0-9A-Z]{16}"
    ["AWS Secret Key"]="[0-9a-zA-Z/+=]{40}"
    ["GitHub Token"]="ghp_[0-9a-zA-Z]{36}"
    ["GitHub OAuth"]="gho_[0-9a-zA-Z]{36}"
    ["Slack Token"]="xox[baprs]-[0-9a-zA-Z-]+"
    ["Slack Webhook"]="https://hooks.slack.com/services/[A-Z0-9/]+"
    ["Private Key"]="-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
    ["Generic Secret"]="(secret|password|passwd|pwd|token|api[_-]?key)[\"']?\s*[:=]\s*[\"'][^\"']{8,}"
    ["JWT Token"]="eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"
)

# Files and directories to exclude
EXCLUDE_DIRS=(
    "node_modules"
    ".git"
    "dist"
    "build"
    "coverage"
    ".expo"
    "vendor"
    "__pycache__"
)

# Build exclude arguments
EXCLUDE_ARGS=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-dir=$dir"
done

# File extensions to check
FILE_PATTERNS=(
    "*.json"
    "*.js"
    "*.ts"
    "*.jsx"
    "*.tsx"
    "*.env*"
    "*.yml"
    "*.yaml"
    "*.sh"
    "*.bash"
    "*.py"
    "*.rb"
    "*.go"
    "*.java"
    "*.php"
    "*.xml"
    "*.config"
    "*.conf"
)

# Build include arguments
INCLUDE_ARGS=""
for pattern in "${FILE_PATTERNS[@]}"; do
    INCLUDE_ARGS="$INCLUDE_ARGS --include=$pattern"
done

echo -e "${YELLOW}Scanning for exposed credentials...${NC}"
echo ""

# Scan for each pattern
for name in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$name]}"
    echo -e "${BLUE}Checking for: $name${NC}"
    
    # Search for pattern
    results=$(grep -rEn $EXCLUDE_ARGS $INCLUDE_ARGS "$pattern" . 2>/dev/null || true)
    
    if [ -n "$results" ]; then
        echo -e "${RED}⚠️  FOUND: $name${NC}"
        echo "$results" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            line_num=$(echo "$line" | cut -d: -f2)
            content=$(echo "$line" | cut -d: -f3- | sed 's/^[[:space:]]*//')
            
            # Mask the actual value
            masked=$(echo "$content" | sed -E 's/(secret|password|token|key)[[:space:]]*[:=][[:space:]]*["\047]?[^"\047[:space:]]{4}/\1=*****/gi')
            
            echo -e "  ${YELLOW}File:${NC} $file"
            echo -e "  ${YELLOW}Line:${NC} $line_num"
            echo -e "  ${YELLOW}Content:${NC} $masked"
            echo ""
            
            ((ISSUES_FOUND++))
        done
    else
        echo -e "${GREEN}✓ No $name found${NC}"
    fi
    echo ""
done

# Check for specific known exposed tokens
echo -e "${BLUE}Checking for known exposed tokens...${NC}"
echo ""

KNOWN_TOKENS=(
    # Add known exposed tokens here (partial matches)
    # Example: "xelgJGC0QjWz"
    # Example: "AKIATPUJM4K5"
)

for token in "${KNOWN_TOKENS[@]}"; do
    if grep -rq "$token" . $EXCLUDE_ARGS 2>/dev/null; then
        echo -e "${RED}🚨 CRITICAL: Known exposed token found!${NC}"
        echo -e "Token: ${token:0:10}..."
        grep -rn "$token" . $EXCLUDE_ARGS 2>/dev/null | while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            echo -e "  ${YELLOW}File:${NC} $file"
        done
        echo -e "${RED}ACTION REQUIRED: Rotate this credential immediately!${NC}"
        echo ""
        ((ISSUES_FOUND++))
    fi
done

# Check git history for secrets
echo -e "${BLUE}Checking git history for secrets...${NC}"
echo ""

if [ -d .git ]; then
    # Check recent commits
    git log --all --full-history --source --pretty=format:"%H" -10 | while read commit; do
        for name in "${!PATTERNS[@]}"; do
            pattern="${PATTERNS[$name]}"
            if git show "$commit" | grep -qE "$pattern" 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Potential $name in commit: ${commit:0:8}${NC}"
                ((ISSUES_FOUND++))
            fi
        done
    done
else
    echo -e "${YELLOW}Not a git repository, skipping history check${NC}"
fi
echo ""

# Check for .env files that might be committed
echo -e "${BLUE}Checking for committed .env files...${NC}"
echo ""

if [ -d .git ]; then
    env_files=$(git ls-files | grep -E "\.env$|\.env\." || true)
    if [ -n "$env_files" ]; then
        echo -e "${RED}⚠️  .env files found in git:${NC}"
        echo "$env_files" | while read file; do
            echo -e "  ${YELLOW}$file${NC}"
            ((ISSUES_FOUND++))
        done
        echo ""
        echo -e "${YELLOW}These files should be in .gitignore!${NC}"
    else
        echo -e "${GREEN}✓ No .env files committed${NC}"
    fi
else
    echo -e "${YELLOW}Not a git repository, skipping${NC}"
fi
echo ""

# Check .gitignore
echo -e "${BLUE}Checking .gitignore configuration...${NC}"
echo ""

if [ -f .gitignore ]; then
    REQUIRED_IGNORES=(
        ".env"
        ".env.local"
        ".env.*.local"
        ".gitpod.env"
        "*.pem"
        "*.key"
        "*.p12"
        "*.pfx"
    )
    
    missing_ignores=()
    for ignore in "${REQUIRED_IGNORES[@]}"; do
        if ! grep -q "^$ignore" .gitignore 2>/dev/null; then
            missing_ignores+=("$ignore")
        fi
    done
    
    if [ ${#missing_ignores[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Missing .gitignore entries:${NC}"
        for ignore in "${missing_ignores[@]}"; do
            echo -e "  - $ignore"
        done
        echo ""
        echo -e "${BLUE}Add these to .gitignore:${NC}"
        for ignore in "${missing_ignores[@]}"; do
            echo "$ignore"
        done
        ((ISSUES_FOUND++))
    else
        echo -e "${GREEN}✓ .gitignore properly configured${NC}"
    fi
else
    echo -e "${RED}⚠️  No .gitignore file found!${NC}"
    ((ISSUES_FOUND++))
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}SECURITY SCAN SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No security issues found!${NC}"
    echo ""
    echo -e "${GREEN}Your repository appears to be secure.${NC}"
else
    echo -e "${RED}⚠️  Found $ISSUES_FOUND potential security issue(s)${NC}"
    echo ""
    echo -e "${YELLOW}RECOMMENDED ACTIONS:${NC}"
    echo ""
    echo "1. Rotate any exposed credentials immediately"
    echo "2. Remove secrets from code and use environment variables"
    echo "3. Update .gitignore to prevent future commits"
    echo "4. Use EAS secrets for Expo builds"
    echo "5. Use GitHub Secrets for CI/CD"
    echo "6. Consider using git-secrets or similar tools"
    echo ""
    echo -e "${BLUE}Quick fixes:${NC}"
    echo "  ./scripts/rotate-credentials.sh    # Rotate AWS credentials"
    echo "  ./scripts/setup-env.sh             # Setup environment variables"
    echo ""
    echo -e "${RED}If credentials were exposed in git history:${NC}"
    echo "  git filter-branch --force --index-filter \\"
    echo "    'git rm --cached --ignore-unmatch path/to/file' \\"
    echo "    --prune-empty --tag-name-filter cat -- --all"
    echo ""
fi

# Exit with error if issues found
if [ $ISSUES_FOUND -gt 0 ]; then
    exit 1
else
    exit 0
fi
