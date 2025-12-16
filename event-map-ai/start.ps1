# PowerShell script to start both backend and frontend servers

Write-Host "Starting EventMap application..." -ForegroundColor Green

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\backend'; npm run dev" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\frontend'; npm run dev" -WindowStyle Normal

Write-Host "Servers started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5001" -ForegroundColor Cyan