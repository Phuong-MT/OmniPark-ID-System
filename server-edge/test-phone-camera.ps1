param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [string]$EdgeApiUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

try {
    $status = Invoke-RestMethod -Uri "$EdgeApiUrl/status" -TimeoutSec 5
} catch {
    throw "Edge API is not running at $EdgeApiUrl. Start it with: docker compose up --build"
}

$result = Invoke-RestMethod `
    -Method Post `
    -Uri "$EdgeApiUrl/streams/probe" `
    -ContentType "application/json" `
    -Body (@{ url = $Url } | ConvertTo-Json) `
    -TimeoutSec 20

[pscustomobject]@{
    EdgeStatus = $status.status
    Connected = $result.connected
    Resolution = if ($result.width) { "$($result.width)x$($result.height)" } else { $null }
    ElapsedMs = $result.elapsed_ms
    Error = $result.error
} | Format-List

if (-not $result.connected) {
    exit 1
}
