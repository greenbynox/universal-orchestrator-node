$serverProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev:backend" -PassThru -NoNewWindow
Write-Host "Server started with PID: $($serverProcess.Id)"
Start-Sleep -Seconds 20

try {
    Write-Host "Testing /api/dashboard/stats..."
    $r = Invoke-WebRequest -Uri "http://localhost:3001/api/dashboard/stats" -UseBasicParsing
    Write-Host "Success: $($r.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body: $($reader.ReadToEnd())"
    }
}

Stop-Process -Id $serverProcess.Id -Force
