#!/bin/bash
# SEO Meta Tag Checker for Africa Railways
# Checks which HTML files are missing key SEO tags

echo "=== Africa Railways SEO Checker ==="
echo ""

# Key SEO elements to check
check_seo() {
    local file=$1
    local missing=""
    
    # Check for og:title
    if ! grep -q 'og:title' "$file" 2>/dev/null; then
        missing="$missing og:title"
    fi
    
    # Check for og:description
    if ! grep -q 'og:description' "$file" 2>/dev/null; then
        missing="$missing og:description"
    fi
    
    # Check for twitter:card
    if ! grep -q 'twitter:card' "$file" 2>/dev/null; then
        missing="$missing twitter:card"
    fi
    
    # Check for meta description
    if ! grep -q 'name="description"' "$file" 2>/dev/null; then
        missing="$missing meta-description"
    fi
    
    # Check for canonical
    if ! grep -q 'rel="canonical"' "$file" 2>/dev/null; then
        missing="$missing canonical"
    fi
    
    if [ -n "$missing" ]; then
        echo "❌ $file - Missing:$missing"
    else
        echo "✅ $file - Complete"
    fi
}

echo "Checking main pages..."
echo ""

# Check key pages
for file in index.html about.html tokenomics.html sentinel.html ido-dashboard.html whitelist.html book-tickets.html blog/index.html; do
    if [ -f "$file" ]; then
        check_seo "$file"
    fi
done

echo ""
echo "=== Summary ==="
total=$(find . -maxdepth 2 -name "*.html" -type f | grep -v node_modules | grep -v ".bak" | wc -l)
with_og=$(grep -l "og:title" *.html blog/*.html 2>/dev/null | wc -l)
echo "Total HTML files: $total"
echo "Files with Open Graph: $with_og"
