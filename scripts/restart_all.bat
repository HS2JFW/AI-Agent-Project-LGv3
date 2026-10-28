@echo off
title AI Agent - Restart All Services
echo ==========================================
echo    Restarting AI Agent Project Servers
echo ==========================================

echo Stopping Backend on port 8001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 "') do (
    if not "%%a"=="0" (
        echo Killing process %%a (Port 8001)...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Stopping Frontend on port 5176...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5176 "') do (
    if not "%%a"=="0" (
        echo Killing process %%a (Port 5176)...
        taskkill /F /PID %%a 2>NUL
    )
)

echo Waiting for ports to release...
ping 127.0.0.1 -n 3 > nul

echo Restarting services...
call "%~dp0start_all.bat"

