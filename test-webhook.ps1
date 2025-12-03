# Test Inventory Webhook for Tanja Unlimited
# This script sends a test inventory webhook to verify the webhook handler is working

$webhookUrl = "https://tanja-unlimited-809785351172.europe-north1.run.app/api/campaigns/webhook"

# Get API key from environment variable (or prompt if not set)
$apiKey = $env:FRONTEND_API_KEY
if (-not $apiKey) {
    $apiKey = $env:CUSTOMER_API_KEY
}
if (-not $apiKey) {
    Write-Host "⚠️  API key not found in environment variables (FRONTEND_API_KEY or CUSTOMER_API_KEY)" -ForegroundColor Yellow
    Write-Host "Please set FRONTEND_API_KEY environment variable or enter it manually:" -ForegroundColor Yellow
    $apiKey = Read-Host "Enter API key"
}

# Test payload - Inventory update with variants (like VALJ product)
$testPayload = @{
    action = "inventory.updated"
    eventId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    inventory = @{
        productId = "VALJ"
        name = "Valentins Jacka"
        sku = "VALJ"
        stock = 15
        status = "in_stock"
        outOfStock = $false
        lowStock = $false
        variants = @(
            @{
                key = "S"
                articleNumber = "VALJ-S"
                sku = "VALJ-S"
                size = "S"
                color = "Svart"
                stock = 5
                status = "in_stock"
                outOfStock = $false
                lowStock = $false
                stripePriceId = "price_1SZbvIP6vvUUervCGYWBlU5x"
                priceSEK = 500000
            },
            @{
                key = "M"
                articleNumber = "VALJ-M"
                sku = "VALJ-M"
                size = "M"
                color = "Svart"
                stock = 0
                status = "out_of_stock"
                outOfStock = $true
                lowStock = $false
                stripePriceId = "price_1SZbvIP6vvUUervCERyxTqVl"
                priceSEK = 500000
            },
            @{
                key = "L"
                articleNumber = "VALJ-L"
                sku = "VALJ-L"
                size = "L"
                color = "Svart"
                stock = 10
                status = "in_stock"
                outOfStock = $false
                lowStock = $false
                stripePriceId = "price_1SZbvIP6vvUUervC3IGlZlGS"
                priceSEK = 500000
            }
        )
    }
} | ConvertTo-Json -Depth 10

Write-Host "`n📨 Sending test webhook to: $webhookUrl" -ForegroundColor Cyan
Write-Host "📦 Payload:" -ForegroundColor Cyan
Write-Host $testPayload -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $testPayload -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $apiKey"
    } -UseBasicParsing

    Write-Host "`n✅ Webhook sent successfully!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Gray
    
    if ($response.StatusCode -eq 200) {
        Write-Host "`n✅ Webhook processed successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Check the application logs for:" -ForegroundColor Yellow
        Write-Host "   - Inventory webhook received" -ForegroundColor Gray
        Write-Host "   - Indexed variant messages" -ForegroundColor Gray
        Write-Host "2. Test inventory lookup:" -ForegroundColor Yellow
        $testUrl = $webhookUrl -replace "/webhook", "/inventory/status"
        Write-Host "   GET ${testUrl}?stripePriceId=price_1SZbvIP6vvUUervCGYWBlU5x" -ForegroundColor Gray
    }
} catch {
    Write-Host "`n❌ Error sending webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
