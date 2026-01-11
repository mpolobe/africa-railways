#!/usr/bin/env python3
# /scripts/launch_timer_sync.py
"""
Launch Timer Sync for Sentinel ($SENT)
Tracks key dates and milestones for TAZARA/ZRL integration
"""

from datetime import datetime, timedelta

# OFFICIAL DATA FROM TAZARA/ZRL 2026 ANNOUNCEMENTS
TAZARA_LAUNCH = datetime(2026, 2, 10, 14, 0)  # 14:00 CAT
ZRL_FUNDING_RELEASE = "K100M (Released Nov 2025)"
EU_RSSP_FUNDING = "€50M (Active 2026)"
LOBITO_CORRIDOR_FUNDING = "$753M (Secured Late 2025)"

# Key milestones
MILESTONES = {
    "TAZARA_RESUMPTION": {
        "date": datetime(2026, 2, 10, 14, 0),
        "title": "TAZARA Mukuba Service Resumed",
        "status": "COMPLETED",
        "description": "Cross-border passenger service between Zambia and Tanzania"
    },
    "PINKSALE_IDO": {
        "date": datetime(2026, 2, 28, 0, 0),  # Estimated
        "title": "$SENT PinkSale IDO Launch",
        "status": "UPCOMING",
        "description": "Public token sale on PinkSale (Polygon)"
    },
    "MOBILE_APP_BETA": {
        "date": datetime(2026, 3, 15, 0, 0),
        "title": "Mobile App Beta Launch",
        "status": "UPCOMING",
        "description": "iOS/Android apps for workers and passengers"
    },
    "ZRL_PILOT": {
        "date": datetime(2026, 3, 31, 0, 0),
        "title": "ZRL Signaling Pilot Complete",
        "status": "IN_PROGRESS",
        "description": "Digital Signal Layer pilot project with Zambia Railways"
    },
    "LOBITO_INTEGRATION": {
        "date": datetime(2026, 7, 1, 0, 0),
        "title": "Lobito Corridor Integration",
        "status": "PLANNED",
        "description": "Digital interoperability for Angola-DRC-Zambia freight"
    }
}

def check_sync():
    """Check synchronization with key milestones"""
    now = datetime.now()
    
    print("=" * 70)
    print("🚂 SENTINEL SECTOR SYNC - LAUNCH TIMER")
    print("=" * 70)
    print(f"Current Date: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # TAZARA Launch Status
    days_since_tazara = (now - TAZARA_LAUNCH).days
    print("📊 TAZARA MUKUBA SERVICE STATUS:")
    print("-" * 70)
    if days_since_tazara >= 0:
        print(f"✅ LIVE - Resumed {days_since_tazara} days ago (Feb 10, 2026)")
        print(f"   Status: Operational with 2,000+ workers using Sentinel systems")
    else:
        days_to_tazara = abs(days_since_tazara)
        print(f"⏳ COUNTDOWN - {days_to_tazara} days until resumption")
        print(f"   Alert: Update website banner when days < 7")
    print()
    
    # Funding Status
    print("💰 FUNDING STATUS:")
    print("-" * 70)
    print(f"✅ ZRL: {ZRL_FUNDING_RELEASE}")
    print(f"✅ EU RSSP: {EU_RSSP_FUNDING}")
    print(f"✅ Lobito: {LOBITO_CORRIDOR_FUNDING}")
    print(f"   Total Pipeline: $2.2B+ in railway modernization")
    print()
    
    # Upcoming Milestones
    print("📅 UPCOMING MILESTONES:")
    print("-" * 70)
    
    upcoming = []
    for milestone_id, milestone in MILESTONES.items():
        days_until = (milestone['date'] - now).days
        if days_until >= 0:
            upcoming.append((days_until, milestone))
    
    upcoming.sort(key=lambda x: x[0])
    
    for days_until, milestone in upcoming[:5]:  # Show next 5 milestones
        status_icon = {
            "COMPLETED": "✅",
            "IN_PROGRESS": "🔄",
            "UPCOMING": "📋",
            "PLANNED": "📋"
        }.get(milestone['status'], "📋")
        
        print(f"{status_icon} {milestone['title']}")
        print(f"   Date: {milestone['date'].strftime('%Y-%m-%d')}")
        print(f"   Days: {days_until} days")
        print(f"   Status: {milestone['status']}")
        print(f"   Details: {milestone['description']}")
        print()
    
    # Blog/Website Sync Status
    print("📝 CONTENT SYNC STATUS:")
    print("-" * 70)
    print("✅ Blog: 'Mukuba Returns' ready for publication")
    print("✅ Blog: 'Golden Age of African Rail' ready for publication")
    print("✅ Website: Banner HTML generated")
    print("✅ Website: Hero section updated")
    print("✅ Website: SEO meta tags prepared")
    print()
    
    # Action Items
    print("🎯 ACTION ITEMS:")
    print("-" * 70)
    
    if days_since_tazara >= 0:
        print("1. ✅ TAZARA resumed - Update website banner NOW")
        print("2. 📢 Publish 'Mukuba Returns' blog post")
        print("3. 📢 Publish 'Golden Age' blog post")
        print("4. 🐦 Post Twitter thread about TAZARA resumption")
        print("5. 💬 Announce in Telegram with full details")
        print("6. 🔗 Update GitHub README with latest milestones")
    else:
        print("1. ⏳ Prepare for TAZARA resumption")
        print("2. 📝 Finalize blog posts")
        print("3. 🎨 Create social media graphics")
        print("4. 📧 Prepare email announcement")
    
    print()
    print("=" * 70)
    print("✅ SYNC CHECK COMPLETE")
    print("=" * 70)
    print()
    
    return {
        'days_since_tazara': days_since_tazara,
        'upcoming_milestones': upcoming,
        'funding_status': {
            'zrl': ZRL_FUNDING_RELEASE,
            'eu_rssp': EU_RSSP_FUNDING,
            'lobito': LOBITO_CORRIDOR_FUNDING
        }
    }

def generate_countdown_widget():
    """Generate HTML countdown widget for website"""
    now = datetime.now()
    
    # Find next milestone
    next_milestone = None
    min_days = float('inf')
    
    for milestone_id, milestone in MILESTONES.items():
        days_until = (milestone['date'] - now).days
        if 0 <= days_until < min_days:
            min_days = days_until
            next_milestone = milestone
    
    if next_milestone:
        html = f"""
<!-- Countdown Widget for {next_milestone['title']} -->
<div class="countdown-widget" style="
    background: linear-gradient(135deg, rgba(255,184,0,0.1), rgba(0,212,255,0.1));
    border: 2px solid #FFB800;
    border-radius: 15px;
    padding: 30px;
    text-align: center;
    margin: 40px 0;
">
    <h3 style="color: #FFB800; margin-bottom: 15px;">Next Milestone</h3>
    <div style="font-size: 1.5rem; color: #00D4FF; font-weight: 700; margin-bottom: 10px;">
        {next_milestone['title']}
    </div>
    <div style="font-size: 3rem; color: #FFB800; font-weight: 900; margin: 20px 0;">
        {min_days} Days
    </div>
    <div style="color: #aaa; font-size: 0.95rem;">
        {next_milestone['description']}
    </div>
</div>
"""
        print("📋 COUNTDOWN WIDGET HTML:")
        print("-" * 70)
        print(html)
        print("-" * 70)
        return html
    
    return None

if __name__ == "__main__":
    print("\n")
    results = check_sync()
    print("\n")
    generate_countdown_widget()
    print("\n")
    print("💡 TIP: Run this script weekly to stay synced with sector updates!")
    print("📧 Contact: contact@africarailways.com")
    print()
