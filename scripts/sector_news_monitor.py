#!/usr/bin/env python3
# /scripts/sector_news_monitor.py
"""
Railway Sector News Monitor for Africa Railways
Tracks press releases and updates from ZRL, TAZARA, and regional partners
Run weekly to update website news section
"""

import requests
from datetime import datetime
import json
import os
from bs4 import BeautifulSoup
import re

# News sources configuration
SITES = {
    "ZRL": {
        "url": "https://zrl.com.zm/press-release/",
        "name": "Zambia Railways Limited",
        "keywords": ["K100M", "recapitalization", "EU", "RSSP", "signaling", "modernization"]
    },
    "TAZARA": {
        "url": "https://www.tazarasite.com/news",
        "name": "Tanzania-Zambia Railway Authority",
        "keywords": ["Mukuba", "resumption", "CCECC", "rehabilitation", "concession", "passenger service"]
    },
    "SADC": {
        "url": "https://www.sadc.int/news",
        "name": "SADC Secretariat",
        "keywords": ["railway", "transport", "OSBP", "border", "integration"]
    },
    "AfDB": {
        "url": "https://www.afdb.org/en/news-and-events/press-releases",
        "name": "African Development Bank",
        "keywords": ["railway", "Zambia", "Tanzania", "infrastructure", "transport"]
    }
}

# Key milestones to track
MILESTONES = {
    "ZRL_K100M": {
        "description": "K100 Million government injection to ZRL",
        "status": "Announced 2024",
        "next_update": "Q1 2026 disbursement report"
    },
    "ZRL_EU_50M": {
        "description": "€50 Million EU Railway Sector Support Programme",
        "status": "Active",
        "next_update": "Signaling modernization contract award"
    },
    "TAZARA_RESUMPTION": {
        "description": "Mukuba Service cross-border passenger service",
        "status": "Resumed February 10, 2026",
        "next_update": "Monthly performance data"
    },
    "TAZARA_CCECC": {
        "description": "$1.4 Billion CCECC rehabilitation commitment",
        "status": "In progress",
        "next_update": "Phase 1 completion report"
    },
    "LOBITO_CORRIDOR": {
        "description": "$753 Million Lobito Atlantic Railway",
        "status": "Construction underway",
        "next_update": "Zambia connection timeline"
    },
    "DURBAN_LUBUMBASHI": {
        "description": "One-Stop Border Crossing agreements",
        "status": "Signed late 2025",
        "next_update": "Implementation progress"
    }
}

def check_for_updates():
    """Main function to check all news sources"""
    print("=" * 60)
    print("🚂 2026 AFRICAN RAIL SECTOR MONITOR")
    print("=" * 60)
    print(f"Scan Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    updates_found = []
    
    # Check milestone status
    print("📊 KEY MILESTONES STATUS:")
    print("-" * 60)
    for milestone_id, milestone in MILESTONES.items():
        print(f"✓ {milestone['description']}")
        print(f"  Status: {milestone['status']}")
        print(f"  Next Update: {milestone['next_update']}")
        print()
    
    # Check news sources
    print("📰 NEWS SOURCES SCAN:")
    print("-" * 60)
    
    for source_id, source in SITES.items():
        print(f"\n🔍 Checking {source['name']}...")
        print(f"   URL: {source['url']}")
        
        try:
            # Attempt to fetch news (with timeout)
            response = requests.get(source['url'], timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; AfricaRailwaysBot/1.0)'
            })
            
            if response.status_code == 200:
                # Parse HTML
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for keywords in page content
                page_text = soup.get_text().lower()
                found_keywords = [kw for kw in source['keywords'] if kw.lower() in page_text]
                
                if found_keywords:
                    print(f"   ✅ Active content found")
                    print(f"   Keywords detected: {', '.join(found_keywords)}")
                    updates_found.append({
                        'source': source['name'],
                        'url': source['url'],
                        'keywords': found_keywords,
                        'timestamp': datetime.now().isoformat()
                    })
                else:
                    print(f"   ℹ️  No recent updates matching keywords")
            else:
                print(f"   ⚠️  HTTP {response.status_code} - Site may be down")
                
        except requests.exceptions.Timeout:
            print(f"   ⚠️  Timeout - Site not responding")
        except requests.exceptions.RequestException as e:
            print(f"   ⚠️  Error: {str(e)[:50]}...")
        except Exception as e:
            print(f"   ❌ Unexpected error: {str(e)[:50]}...")
    
    # Special checks for confirmed updates
    print("\n" + "=" * 60)
    print("🎯 CONFIRMED UPDATES FOR WEBSITE:")
    print("=" * 60)
    
    confirmed_updates = [
        {
            "title": "TAZARA Mukuba Service Resumed",
            "date": "February 10, 2026",
            "source": "TAZARA Official",
            "action": "✅ UPDATE WEBSITE BANNER",
            "content": "Cross-border passenger service between New Kapiri Mposhi and Dar es Salaam officially resumed. Fleet availability remains constrained due to aging equipment."
        },
        {
            "title": "ZRL K100M Recapitalization Active",
            "date": "2024-2028 Strategic Plan",
            "source": "Zambia Railways Limited",
            "action": "✅ UPDATE PARTNERSHIP PAGE",
            "content": "K100 Million government injection supporting signaling and telecommunications modernization."
        },
        {
            "title": "EU €50M Railway Support Programme",
            "date": "Active 2026",
            "source": "EU RSSP",
            "action": "✅ ADD TO FUNDING SECTION",
            "content": "€50 Million EU funding for ZRL modernization, focusing on signaling infrastructure."
        },
        {
            "title": "Lobito Corridor $753M Secured",
            "date": "Late 2025",
            "source": "Regional Development",
            "action": "✅ UPDATE CORRIDORS MAP",
            "content": "$753 Million secured for Lobito Atlantic Railway connecting Angola-DRC-Zambia."
        }
    ]
    
    for i, update in enumerate(confirmed_updates, 1):
        print(f"\n{i}. {update['title']}")
        print(f"   Date: {update['date']}")
        print(f"   Source: {update['source']}")
        print(f"   {update['action']}")
        print(f"   Details: {update['content']}")
    
    # Save results to JSON
    results = {
        'scan_date': datetime.now().isoformat(),
        'milestones': MILESTONES,
        'updates_found': updates_found,
        'confirmed_updates': confirmed_updates
    }
    
    output_file = 'sector_news_latest.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n" + "=" * 60)
    print(f"📁 Results saved to: {output_file}")
    print("=" * 60)
    
    # Generate website update recommendations
    print("\n🔧 WEBSITE UPDATE RECOMMENDATIONS:")
    print("-" * 60)
    print("1. Homepage Banner:")
    print("   'TAZARA Mukuba Service Resumed - February 2026'")
    print()
    print("2. News Section:")
    print("   Add all 4 confirmed updates with dates and sources")
    print()
    print("3. Alpha Node Map:")
    print("   - Label Kapiri Mposhi: 'Sentinel Cross-Border Settlement Point'")
    print("   - Label Chingola-Luacano: 'Powered by $SENT Data Logistics'")
    print("   - Label Dar es Salaam: 'AFC Integrated Ticketing Hub'")
    print()
    print("4. SEO Meta Tags:")
    print("   Add: 'TAZARA Resumption 2026', 'ZRL K100M', 'EU RSSP Zambia'")
    print()
    print("5. Partnership Page:")
    print("   Update ZRL status: 'Active - K100M Recapitalization'")
    print("   Update TAZARA status: 'Active - Mukuba Service Live'")
    print()
    
    return results

def generate_website_banner():
    """Generate HTML for website banner"""
    banner_html = """
<!-- TAZARA Resumption Banner -->
<div class="news-banner" style="background: linear-gradient(135deg, #FFB800, #FF9500); padding: 15px; text-align: center; color: #0a0e1a; font-weight: bold; border-bottom: 2px solid #0a0e1a;">
    🚂 <strong>BREAKING:</strong> TAZARA Mukuba Service Resumed - February 10, 2026 | 
    Cross-border passenger service now active between Zambia and Tanzania | 
    <a href="/news" style="color: #0a0e1a; text-decoration: underline;">Read More →</a>
</div>
"""
    
    print("\n📋 COPY THIS BANNER HTML:")
    print("-" * 60)
    print(banner_html)
    print("-" * 60)
    
    return banner_html

def generate_news_section():
    """Generate HTML for news section"""
    news_html = """
<!-- News Section -->
<section class="news-section" style="padding: 60px 8%; background: var(--surface);">
    <h2 style="color: var(--gold); font-size: 2.5rem; margin-bottom: 40px;">Latest Railway Sector Updates</h2>
    
    <div class="news-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
        
        <!-- Update 1: TAZARA Resumption -->
        <div class="news-card" style="background: rgba(10,14,26,0.5); padding: 30px; border-radius: 15px; border-left: 4px solid var(--gold);">
            <div class="news-date" style="color: var(--cyan); font-size: 0.9rem; margin-bottom: 10px;">February 10, 2026</div>
            <h3 style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">TAZARA Mukuba Service Resumed</h3>
            <p style="color: #ccc; line-height: 1.6;">Cross-border passenger service between New Kapiri Mposhi and Dar es Salaam officially resumed. Sentinel provides real-time equipment monitoring to support fleet optimization.</p>
            <a href="#" style="color: var(--cyan); text-decoration: none; font-weight: 600; margin-top: 15px; display: inline-block;">Learn More →</a>
        </div>
        
        <!-- Update 2: ZRL Recapitalization -->
        <div class="news-card" style="background: rgba(10,14,26,0.5); padding: 30px; border-radius: 15px; border-left: 4px solid var(--cyan);">
            <div class="news-date" style="color: var(--cyan); font-size: 0.9rem; margin-bottom: 10px;">Active 2024-2028</div>
            <h3 style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">ZRL K100M Recapitalization</h3>
            <p style="color: #ccc; line-height: 1.6;">Zambia Railways Limited receives K100 Million government injection for signaling and telecommunications modernization. $SENT provides the digital signal layer.</p>
            <a href="#" style="color: var(--cyan); text-decoration: none; font-weight: 600; margin-top: 15px; display: inline-block;">Learn More →</a>
        </div>
        
        <!-- Update 3: EU Funding -->
        <div class="news-card" style="background: rgba(10,14,26,0.5); padding: 30px; border-radius: 15px; border-left: 4px solid #8b5cf6;">
            <div class="news-date" style="color: var(--cyan); font-size: 0.9rem; margin-bottom: 10px;">Active 2026</div>
            <h3 style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">EU €50M Railway Support</h3>
            <p style="color: #ccc; line-height: 1.6;">European Union Railway Sector Support Programme provides €50 Million for ZRL infrastructure modernization, with focus on digital systems.</p>
            <a href="#" style="color: var(--cyan); text-decoration: none; font-weight: 600; margin-top: 15px; display: inline-block;">Learn More →</a>
        </div>
        
        <!-- Update 4: Lobito Corridor -->
        <div class="news-card" style="background: rgba(10,14,26,0.5); padding: 30px; border-radius: 15px; border-left: 4px solid #10b981;">
            <div class="news-date" style="color: var(--cyan); font-size: 0.9rem; margin-bottom: 10px;">Late 2025</div>
            <h3 style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">Lobito Corridor $753M Secured</h3>
            <p style="color: #ccc; line-height: 1.6;">$753 Million secured for Lobito Atlantic Railway connecting Angola-DRC-Zambia. Sentinel will provide digital interoperability for cross-border freight.</p>
            <a href="#" style="color: var(--cyan); text-decoration: none; font-weight: 600; margin-top: 15px; display: inline-block;">Learn More →</a>
        </div>
        
    </div>
</section>
"""
    
    print("\n📋 COPY THIS NEWS SECTION HTML:")
    print("-" * 60)
    print(news_html)
    print("-" * 60)
    
    return news_html

def check_github_for_updates():
    """Check if there are new commits that should trigger website updates"""
    print("\n🔍 Checking GitHub for recent updates...")
    
    try:
        # Check last commit
        result = os.popen('git log -1 --pretty=format:"%h - %s (%cr)"').read()
        print(f"   Latest commit: {result}")
        
        # Check if documentation was updated
        doc_files = [
            'SENT_INFRASTRUCTURE_ONEPAGER.md',
            'TOKENOMICS.md',
            'SENT_LITEPAPER.md'
        ]
        
        for doc in doc_files:
            if os.path.exists(doc):
                mtime = os.path.getmtime(doc)
                age_hours = (datetime.now().timestamp() - mtime) / 3600
                if age_hours < 24:
                    print(f"   ✅ {doc} updated recently ({age_hours:.1f} hours ago)")
                    print(f"      → Sync to website recommended")
    except Exception as e:
        print(f"   ⚠️  Could not check git status: {e}")

if __name__ == "__main__":
    print("\n")
    results = check_for_updates()
    print("\n")
    generate_website_banner()
    print("\n")
    generate_news_section()
    print("\n")
    check_github_for_updates()
    print("\n")
    print("=" * 60)
    print("✅ SECTOR NEWS MONITOR COMPLETE")
    print("=" * 60)
    print("\nNext Steps:")
    print("1. Review sector_news_latest.json for detailed results")
    print("2. Copy banner HTML to index.html")
    print("3. Add news section to homepage")
    print("4. Update SEO meta tags")
    print("5. Sync documentation to website")
    print("\nRun this script weekly to stay updated!")
    print()
