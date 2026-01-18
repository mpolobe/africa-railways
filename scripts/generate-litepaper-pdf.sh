#!/bin/bash
# Generate SENT Litepaper PDF
#
# This script creates a print-ready HTML file and provides instructions
# for generating the PDF.
#
# Usage: ./scripts/generate-litepaper-pdf.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_FILE="$PROJECT_DIR/SENT_LITEPAPER.md"
OUTPUT_DIR="$PROJECT_DIR/docs"
HTML_OUTPUT="$OUTPUT_DIR/SENT_Litepaper_print.html"
PDF_OUTPUT="$OUTPUT_DIR/SENT_Litepaper.pdf"

# Create docs directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "📄 Generating print-ready HTML from SENT_LITEPAPER.md..."

# Check if pandoc is available
if command -v pandoc &> /dev/null; then
    echo "Using pandoc to convert markdown to HTML..."
    pandoc "$SOURCE_FILE" \
        --standalone \
        --metadata title="SENT Litepaper - Africa Railways" \
        --css="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" \
        -o "$HTML_OUTPUT"
    
    # Add custom styling
    sed -i 's|</head>|<style>
body { font-family: Inter, -apple-system, sans-serif; line-height: 1.7; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
h1 { color: #0a0e1a; border-bottom: 4px solid #FFB800; padding-bottom: 15px; }
h2 { color: #0a0e1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-top: 50px; }
h3 { color: #333; margin-top: 35px; }
table { width: 100%; border-collapse: collapse; margin: 25px 0; }
th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
th { background: #0a0e1a; color: white; }
tr:nth-child(even) { background: #f9f9f9; }
pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
a { color: #0066cc; }
@media print { body { padding: 0; } }
</style></head>|' "$HTML_OUTPUT"
    
    echo "✅ HTML generated: $HTML_OUTPUT"
else
    # Fallback: Create HTML using Node.js
    echo "Pandoc not found, using Node.js..."
    
    node -e "
const fs = require('fs');
const path = require('path');

async function convert() {
    const { marked } = await import('marked');
    const md = fs.readFileSync('$SOURCE_FILE', 'utf8');
    const html = marked.parse(md);
    
    const fullHtml = \`<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <title>SENT Litepaper - Africa Railways</title>
    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap\" rel=\"stylesheet\">
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.7; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
        h1 { color: #0a0e1a; border-bottom: 4px solid #FFB800; padding-bottom: 15px; font-size: 2.5rem; }
        h2 { color: #0a0e1a; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-top: 50px; font-size: 1.8rem; }
        h3 { color: #333; margin-top: 35px; font-size: 1.4rem; }
        h4 { color: #444; margin-top: 25px; }
        p { margin-bottom: 16px; text-align: justify; }
        ul, ol { margin-bottom: 20px; padding-left: 25px; }
        li { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 25px 0; }
        th, td { padding: 12px 15px; text-align: left; border: 1px solid #ddd; }
        th { background: #0a0e1a; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        pre { background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre code { background: none; padding: 0; }
        a { color: #0066cc; }
        hr { border: none; border-top: 2px solid #e0e0e0; margin: 40px 0; }
        @media print { 
            body { padding: 0; max-width: 100%; }
            h2 { page-break-before: auto; page-break-after: avoid; }
            pre, table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
\${html}
<hr>
<p style=\"text-align: center; color: #888;\">
    <strong>Africa Railways</strong><br>
    www.africarailways.com | admin@africarailways.com<br>
    © 2026 Africa Railways. All rights reserved.
</p>
</body>
</html>\`;
    
    fs.writeFileSync('$HTML_OUTPUT', fullHtml);
    console.log('✅ HTML generated: $HTML_OUTPUT');
}

convert();
"
fi

echo ""
echo "📋 To generate the PDF:"
echo ""
echo "   Option 1: Open in browser and print to PDF"
echo "   -----------------------------------------"
echo "   1. Open: $HTML_OUTPUT"
echo "   2. Press Ctrl+P (or Cmd+P on Mac)"
echo "   3. Select 'Save as PDF'"
echo "   4. Save to: $PDF_OUTPUT"
echo ""
echo "   Option 2: Use online converter"
echo "   ------------------------------"
echo "   1. Visit: https://md2pdf.netlify.app/"
echo "   2. Paste contents of SENT_LITEPAPER.md"
echo "   3. Download and save to: $PDF_OUTPUT"
echo ""
echo "   Option 3: Use wkhtmltopdf (if installed)"
echo "   ----------------------------------------"
if command -v wkhtmltopdf &> /dev/null; then
    echo "   wkhtmltopdf is available! Running..."
    wkhtmltopdf --enable-local-file-access "$HTML_OUTPUT" "$PDF_OUTPUT"
    echo "   ✅ PDF generated: $PDF_OUTPUT"
else
    echo "   Install: sudo apt-get install wkhtmltopdf"
    echo "   Then run: wkhtmltopdf $HTML_OUTPUT $PDF_OUTPUT"
fi
