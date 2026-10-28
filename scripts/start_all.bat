@echo off
title AI Agent - Launch All Services
echo ==========================================
echo    Starting AI Agent Project
echo ==========================================

echo [1/2] Starting FastAPI Backend...
start "Backend (FastAPI)" cmd /k ""%~dp0start_backend_fastapi.bat""

echo [2/2] Starting Frontend (React Flow)...
start "Frontend (Vite)" cmd /k ""%~dp0start_frontend.bat""

echo Waiting for services to initialize...
ping 127.0.0.1 -n 4 > nul

echo Opening Web Browser...
start "" "http://localhost:5176"

echo ==========================================
echo    All services launched successfully!
echo    - Frontend: http://localhost:5176
echo    - Swagger UI: http://localhost:8001/docs
echo ==========================================
exit
