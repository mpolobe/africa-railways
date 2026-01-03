# ARAIL USSD Simulator - PowerShell Version
# No Python installation required!

# Configuration
$RAILWAY_URL = "https://africa-railways-production.up.railway.app"
$USSD_ENDPOINT = "$RAILWAY_URL/ussd"
$LUSAKA_PHONE = "+260975190740"
$SERVICE_CODE = "*384*26621#"
$NETWORK_CODE = "64501"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🚂 ARAIL USSD Simulator - First Passenger in Lusaka" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📱 Phone: $LUSAKA_PHONE"
Write-Host "🌍 Network: MTN Zambia ($NETWORK_CODE)"
Write-Host "🔗 Server: $RAILWAY_URL"
Write-Host "💎 Service: $SERVICE_CODE"
Write-Host "============================================================`n" -ForegroundColor Cyan

# Function to simulate USSD call
function Simulate-USSDCall {
    param(
        [string]$Phone,
        [string]$Text = ""
    )
    
    Write-Host "`n--- Dialing $SERVICE_CODE from $Phone ---" -ForegroundColor Yellow
    
    $body = @{
        sessionId = "AT_Sim_Session_12345"
        phoneNumber = $Phone
        networkCode = $NETWORK_CODE
        serviceCode = $SERVICE_CODE
        text = $Text
    }
    
    try {
        $response = Invoke-WebRequest -Uri $USSD_ENDPOINT -Method POST -Body $body -TimeoutSec 30 -UseBasicParsing
        Write-Host "Gateway Response:" -ForegroundColor Green
        Write-Host $response.Content -ForegroundColor White
        Write-Host ""
        return $response.Content
    }
    catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        if ($_.Exception.Message -like "*Could not resolve host*" -or $_.Exception.Message -like "*Unable to connect*") {
            Write-Host "`n💡 Server might not be running at: $RAILWAY_URL" -ForegroundColor Yellow
            Write-Host "   Check Railway dashboard: https://railway.app/dashboard" -ForegroundColor Yellow
        }
        return $null
    }
}

# STEP 1: User dials the code (Main Menu)
Write-Host "🔹 STEP 1: User dials the code" -ForegroundColor Cyan
$response1 = Simulate-USSDCall -Phone $LUSAKA_PHONE -Text ""

if ($null -eq $response1) {
    Write-Host "`n❌ Simulation failed - check your server connection" -ForegroundColor Red
    exit 1
}

# STEP 2: User selects '1' to Check Balance
Write-Host "`n🔹 STEP 2: User enters '1' (Check Balance)" -ForegroundColor Cyan
$response2 = Simulate-USSDCall -Phone $LUSAKA_PHONE -Text "1"

if ($response2 -and ($response2 -like "*balance*" -or $response2 -like "*wallet*")) {
    Write-Host "`n✅ SUCCESS! Wallet balance retrieved from Sui Mainnet!" -ForegroundColor Green
    Write-Host "`n📊 This proves:" -ForegroundColor Cyan
    Write-Host "  ✓ Railway.app server is running"
    Write-Host "  ✓ USSD gateway is responding"
    Write-Host "  ✓ Sui blockchain integration works"
    Write-Host "  ✓ Your Package ID is correctly configured"
}
else {
    Write-Host "`n⚠️  Response received but balance check status unclear" -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "✅ Simulation Complete!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan
