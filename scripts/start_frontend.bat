@echo off
title AI Agent - Frontend (React Flow)
echo ==========================================
echo    Starting Frontend Server (Port 5176)
echo ==========================================
cd /d "%~dp0..\frontend"
call npm.cmd run dev
pause

