@echo off
title Start AI Agent Project Servers
echo ==========================================
echo    Starting AI Agent Project (Manual Mode)
echo ==========================================

echo Starting Backend...
start "Backend Server" cmd /k ""%~dp0start_backend.bat""

echo Starting Frontend...
start "Frontend Server" cmd /k ""%~dp0start_frontend.bat""

echo Waiting for services to start...
:: Using ping instead of timeout to prevent input redirection errors
ping 127.0.0.1 -n 4 > nul

echo Opening Browser...
start chrome http://localhost:5176

echo ==========================================
echo    All services started successfully!
echo ==========================================
exit
