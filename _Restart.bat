@echo off
title Restart Backend Server
echo Stopping Backend Server on port 8000...

:: Find and kill the process listening on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    if not "%%a"=="0" (
        echo Killing process %%a (Port 8000)...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Waiting for processes to close...
timeout /t 2 /nobreak > NUL

cd /d "%~dp0backend_node"
echo Starting Backend Server...
call npm run dev
pause
