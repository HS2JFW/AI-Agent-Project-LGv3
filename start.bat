@echo off
echo ==========================================
echo    Starting AI Agent Project
echo ==========================================

echo Cleaning up old processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo Starting Backend...
cd backend_node
start cmd /k "npm run dev"
cd ..

echo Starting Frontend...
cd frontend
start cmd /k "npm run dev"
cd ..

echo Waiting 8 seconds for services to start completely...
timeout /t 8 /nobreak > nul

echo Opening Browser...
start chrome http://localhost:5174

echo ==========================================
echo    All services started successfully!
echo ==========================================
exit
