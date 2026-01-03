# Railway Deployment Monitor
# Run this to check if the Stats API has deployed

param(
    [switch]$Watch,
    [int]$Interval = 15
)

$RAILWAY_URL = "https://africa-railways-production.up.railway.app"

function Test-Deployment {
    Clear-Host
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "🚂 Railway Deployment Status - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    Write-Host "============================================================`n" -ForegroundColor Cyan
    
    $allDeployed = $true
    
    # Test USSD Gateway
    Write-Host "1️⃣  USSD Gateway (/ussd)" -ForegroundColor White
    try {
        $ussd = Invoke-RestMethod -Uri "$RAILWAY_URL/ussd" -Method POST -Body @{
            sessionId="HEALTH_CHECK"
            phoneNumber="+260975190740"
            networkCode="64501"
            serviceCode="*384*26621#"
            text=""
        } -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ✅ Status: LIVE" -ForegroundColor Green
        Write-Host "   📝 Response: $($ussd.Substring(0, [Math]::Min(50, $ussd.Length)))..." -ForegroundColor Gray
    }
    catch {
        Write-Host "   ❌ Status: OFFLINE" -ForegroundColor Red
        Write-Host "   ⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $allDeployed = $false
    }
    
    Write-Host ""
    
    # Test Stats API
    Write-Host "2️⃣  Stats API (/api/ussd/stats)" -ForegroundColor White
    try {
        $stats = Invoke-RestMethod -Uri "$RAILWAY_URL/api/ussd/stats" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ✅ Status: DEPLOYED!" -ForegroundColor Green
        Write-Host "   📊 Live Metrics:" -ForegroundColor Cyan
        Write-Host "      • Status: $($stats.status)" -ForegroundColor White
        Write-Host "      • Active Sessions: $($stats.active_sessions)" -ForegroundColor White
        Write-Host "      • Sessions Today: $($stats.sessions_today)" -ForegroundColor White
        Write-Host "      • Success Rate: $($stats.success_rate)%" -ForegroundColor White
        Write-Host "      • Avg Response: $($stats.avg_response_time_ms)ms" -ForegroundColor White
        Write-Host "      • Last Activity: $($stats.last_activity)" -ForegroundColor White
        Write-Host "      • Uptime: $($stats.uptime)" -ForegroundColor White
        Write-Host ""
        Write-Host "   🎉 Your OCC Dashboard is now live with real-time data!" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "   ⏳ Status: NOT YET DEPLOYED" -ForegroundColor Yellow
            Write-Host "   📦 HTTP 404 - Endpoint not found (still building)" -ForegroundColor Gray
        }
        else {
            Write-Host "   ❌ Status: ERROR" -ForegroundColor Red
            Write-Host "   ⚠️  HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Yellow
        }
        $allDeployed = $false
    }
    
    Write-Host "`n============================================================" -ForegroundColor Cyan
    
    if ($allDeployed) {
        Write-Host "✅ ALL SERVICES DEPLOYED - Your infrastructure is ready!" -ForegroundColor Green
        Write-Host "`n🔗 Access Points:" -ForegroundColor Cyan
        Write-Host "   • USSD Gateway: $RAILWAY_URL/ussd" -ForegroundColor White
        Write-Host "   • Stats API: $RAILWAY_URL/api/ussd/stats" -ForegroundColor White
        Write-Host "   • OCC Dashboard: Open occ.html in browser`n" -ForegroundColor White
        return $true
    }
    else {
        Write-Host "⏳ DEPLOYMENT IN PROGRESS - Checking again soon..." -ForegroundColor Yellow
        Write-Host "`n💡 Tips while waiting:" -ForegroundColor Cyan
        Write-Host "   • Railway typically deploys in 2-5 minutes" -ForegroundColor White
        Write-Host "   • Check Railway dashboard: https://railway.app/dashboard" -ForegroundColor White
        Write-Host "   • Your test-ussd-dashboard.html auto-refreshes too`n" -ForegroundColor White
        return $false
    }
}

# Main execution
if ($Watch) {
    Write-Host "`n🔄 Starting continuous monitoring (every $Interval seconds)" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow
    
    while ($true) {
        $deployed = Test-Deployment
        
        if ($deployed) {
            Write-Host "`n🎊 Deployment complete! Stopping monitor." -ForegroundColor Green
            break
        }
        
        Start-Sleep -Seconds $Interval
    }
}
else {
    Test-Deployment
    Write-Host "`n💡 Run with -Watch to monitor continuously:" -ForegroundColor Cyan
    Write-Host "   .\check-deployment.ps1 -Watch`n" -ForegroundColor White
}
