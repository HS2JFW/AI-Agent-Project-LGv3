@echo off
title AI Agent - Node.js Backend (Legacy)
echo ==========================================
echo    Starting Node.js Backend (Port 8001)
echo ==========================================
cd /d "%~dp0..\backend_node"
call npm.cmd run dev
pause
