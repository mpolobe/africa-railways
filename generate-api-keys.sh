#!/bin/bash

echo "🔑 Generating API Keys for Africa Railways Project"
echo ""
echo "=================================================="
echo ""

# Generate Railways API key
RAILWAYS_KEY="rw_$(openssl rand -hex 24)"
echo "🚂 RAILWAYS_API_KEY:"
echo "$RAILWAYS_KEY"
echo ""

# Generate Africoin API key
AFRICOIN_KEY="ac_$(openssl rand -hex 24)"
echo "💰 AFRICOIN_API_KEY:"
echo "$AFRICOIN_KEY"
echo ""

echo "=================================================="
echo ""
echo "⚠️  IMPORTANT: Save these keys securely!"
echo ""
echo "📋 Next steps:"
echo "1. Copy these keys to a secure location"
echo "2. Add them to GitHub Secrets"
echo "3. Add them to Vercel Environment Variables"
echo "4. Never commit them to git"
echo ""
echo "🔗 Add to GitHub Secrets:"
echo "   https://github.com/mpolobe/africa-railways/settings/secrets/actions"
echo ""
echo "🔗 Add to Vercel:"
echo "   https://vercel.com/[your-project]/settings/environment-variables"
echo ""
