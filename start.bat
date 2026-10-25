@echo off
echo ========================================================
echo Starting Enterprise ITSM & ITAM CMDB Platform (MERN)
echo ========================================================

start "Nexus ITSM Server (Port 5000)" cmd /k "cd server && node server.js"
start "Nexus ITSM Frontend (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo Server starting at: http://localhost:5000
echo Client starting at: http://localhost:5173
echo.
echo Press any key to run a Python Network Discovery Sweep...
pause >nul
cd python && python discovery_service.py --once
pause
