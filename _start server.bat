@echo off
title Start AI Agent Project Servers
echo ==========================================
echo    Starting AI Agent Project (Manual Mode)
echo ==========================================

echo Starting Backend...
cd backend_node
start "Backend Server" cmd /k "npm.cmd run dev"
cd ..

echo Starting Frontend...
cd frontend
start "Frontend Server" cmd /k "npm.cmd run dev"
cd ..

echo Waiting for services to start...
:: Using ping instead of timeout to prevent input redirection errors
ping 127.0.0.1 -n 4 > nul

echo Opening Browser...
start chrome http://localhost:5173

echo ==========================================
echo    All services started successfully!
echo ==========================================
exit
