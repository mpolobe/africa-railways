#!/usr/bin/env node
/**
 * Generate SENT Litepaper PDF from markdown source
 * 
 * Usage: node scripts/generate-litepaper-pdf.cjs
 * 
 * This script converts SENT_LITEPAPER.md to a styled PDF using md-to-pdf
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
    const sourceFile = path.join(__dirname, '..', 'SENT_LITEPAPER.md');
    const outputDir = path.join(__dirname, '..', 'docs');
    const outputFile = path.join(outputDir, 'SENT_Litepaper.pdf');

    // Ensure docs directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if md-to-pdf is installed
    try {
        require.resolve('md-to-pdf');
    } catch (e) {
        console.log('Installing md-to-pdf...');
        execSync('npm install md-to-pdf', { stdio: 'inherit' });
    }

    const { mdToPdf } = await import('md-to-pdf');

    console.log('Reading SENT_LITEPAPER.md...');
    const markdown = fs.readFileSync(sourceFile, 'utf8');

    // Custom CSS for professional PDF styling
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #333;
            max-width: 100%;
            padding: 0;
            font-size: 11pt;
        }
        
        h1 {
            color: #0a0e1a;
            font-size: 28pt;
            font-weight: 900;
            margin-top: 0;
            padding-bottom: 12px;
            border-bottom: 4px solid #FFB800;
        }
        
        h2 {
            color: #0a0e1a;
            font-size: 18pt;
            font-weight: 700;
            margin-top: 36px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
            page-break-after: avoid;
        }
        
        h3 {
            color: #333;
            font-size: 14pt;
            font-weight: 600;
            margin-top: 28px;
            page-break-after: avoid;
        }
        
        h4 {
            color: #444;
            font-size: 12pt;
            font-weight: 600;
            margin-top: 20px;
        }
        
        p {
            margin-bottom: 12px;
            text-align: justify;
        }
        
        ul, ol {
            margin-bottom: 16px;
            padding-left: 24px;
        }
        
        li {
            margin-bottom: 6px;
        }
        
        strong {
            color: #222;
        }
        
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 9pt;
            color: #c7254e;
        }
        
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 9pt;
            line-height: 1.4;
            page-break-inside: avoid;
        }
        
        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }
        
        th, td {
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #ddd;
        }
        
        th {
            background: #0a0e1a;
            color: white;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        
        a {
            color: #0066cc;
            text-decoration: none;
        }
        
        blockquote {
            border-left: 4px solid #FFB800;
            margin: 20px 0;
            padding: 12px 16px;
            background: #fffbeb;
            font-style: italic;
        }
        
        hr {
            border: none;
            border-top: 2px solid #e0e0e0;
            margin: 32px 0;
        }
        
        /* Page breaks */
        h2 {
            page-break-before: auto;
        }
    `;

    console.log('Generating PDF...');
    
    const pdf = await mdToPdf(
        { content: markdown },
        {
            css: css,
            pdf_options: {
                format: 'A4',
                margin: {
                    top: '2.5cm',
                    right: '2cm',
                    bottom: '2.5cm',
                    left: '2cm'
                },
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
                    <div style="width: 100%; font-size: 9px; padding: 0 2cm; display: flex; justify-content: space-between; color: #888; font-family: Arial, sans-serif;">
                        <span>Africa Railways - $SENT Litepaper v2.0</span>
                        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
                    </div>
                `
            },
            launch_options: {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        }
    );

    if (pdf) {
        fs.writeFileSync(outputFile, pdf.content);
        const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(1);
        console.log(`\n✅ PDF generated successfully: ${outputFile}`);
        console.log(`   File size: ${fileSize} KB`);
    } else {
        throw new Error('PDF generation failed');
    }
}

generatePDF().catch(err => {
    console.error('Error generating PDF:', err.message);
    console.log('\n📋 Alternative: Use an online converter or local tool:');
    console.log('   1. Visit https://md2pdf.netlify.app/');
    console.log('   2. Paste contents of SENT_LITEPAPER.md');
    console.log('   3. Download PDF and save to docs/SENT_Litepaper.pdf');
    process.exit(1);
});
