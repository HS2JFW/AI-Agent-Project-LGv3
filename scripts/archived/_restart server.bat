@echo off
title Restart AI Agent Project Servers
echo ==========================================
echo    Restarting AI Agent Project Servers
echo ==========================================

echo Stopping Backend Server on port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 "') do (
    if not "%%a"=="0" (
        echo Killing backend process %%a...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Stopping Frontend Server on port 5176...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5176 "') do (
    if not "%%a"=="0" (
        echo Killing frontend process %%a...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Waiting for processes to close...
ping 127.0.0.1 -n 3 > nul

echo Starting Backend...
start "Backend Server" cmd /k ""%~dp0start_backend.bat""

echo Starting Frontend...
start "Frontend Server" cmd /k ""%~dp0start_frontend.bat""

echo Opening Browser...
ping 127.0.0.1 -n 4 > nul
start chrome http://localhost:5176

echo ==========================================
echo    Servers Restarted successfully!
echo ==========================================
exit
