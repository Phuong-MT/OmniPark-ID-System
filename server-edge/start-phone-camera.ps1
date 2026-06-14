param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [string]$CameraId = "phone-camera",
    [string]$Direction = "BOTH"
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$env:EDGE_STANDALONE = "true"
$env:ONVIF_DISCOVERY_ENABLED = "false"
$localCameras = @(
    @{
        id = $CameraId
        url = $Url
        direction = $Direction.ToUpperInvariant()
    }
)
$env:LOCAL_CAMERAS_JSON = ConvertTo-Json -InputObject $localCameras -Compress

Push-Location $scriptRoot
try {
    docker info --format "{{.ServerVersion}}" | Out-Null
    docker compose up -d --build edge-api

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Seconds 1
        try {
            Invoke-RestMethod -Uri "http://localhost:8000/status" -TimeoutSec 3 | Out-Null
            $ready = $true
            break
        } catch {
        }
    }

    if (-not $ready) {
        docker compose logs --tail=50 edge-api
        throw "Edge API did not become ready"
    }

    & "$scriptRoot\test-phone-camera.ps1" -Url $Url
    Start-Sleep -Seconds 2
    Invoke-RestMethod -Uri "http://localhost:8000/cameras" -TimeoutSec 5 |
        ConvertTo-Json -Depth 5
} finally {
    Pop-Location
}
