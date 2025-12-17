Write-Host "Killing existing Node processes..."
taskkill /F /IM node.exe /T 2>$null
Start-Sleep -Seconds 2

Write-Host "Starting Backend..."
$backend = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev:backend" -PassThru -NoNewWindow
Write-Host "Backend PID: $($backend.Id)"

Write-Host "Waiting for Backend to initialize..."
Start-Sleep -Seconds 15

Write-Host "Starting Frontend..."
$frontend = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "frontend" -PassThru -NoNewWindow
Write-Host "Frontend PID: $($frontend.Id)"

Write-Host "Servers started. Backend: 3001, Frontend: 5173"
Write-Host "Please wait a moment and then refresh your browser."
