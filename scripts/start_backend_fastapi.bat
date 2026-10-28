@echo off
title AI Agent - FastAPI Backend
echo ==========================================
echo    Starting FastAPI Backend (Port 8001)
echo ==========================================
cd /d "%~dp0..\backend_fastapi"
if exist .venv\Scripts\python.exe (
    call .venv\Scripts\python.exe run.py
) else (
    echo [.venv not found! Trying system python...]
    python run.py
)
pause

