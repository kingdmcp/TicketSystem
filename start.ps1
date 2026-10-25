Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting Enterprise ITSM & ITAM CMDB Platform (MERN)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host "Backend API launched on http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend Client launched on http://localhost:5173" -ForegroundColor Yellow
Write-Host "To execute Python Network Discovery: cd python; python discovery_service.py --once" -ForegroundColor Magenta
