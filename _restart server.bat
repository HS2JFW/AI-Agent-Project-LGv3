@echo off
title Restart AI Agent Project Servers
echo ==========================================
echo    Restarting AI Agent Project Servers
echo ==========================================

echo Stopping Backend Server on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    if not "%%a"=="0" (
        echo Killing backend process %%a...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Stopping Frontend Server on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    if not "%%a"=="0" (
        echo Killing frontend process %%a...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Waiting for processes to close...
ping 127.0.0.1 -n 3 > nul

echo Starting Backend...
cd backend_node
start "Backend Server" cmd /k "npm.cmd run dev"
cd ..

echo Starting Frontend...
cd frontend
start "Frontend Server" cmd /k "npm.cmd run dev"
cd ..

echo Opening Browser...
ping 127.0.0.1 -n 4 > nul
start chrome http://localhost:5173

echo ==========================================
echo    Servers Restarted successfully!
echo ==========================================
exit
