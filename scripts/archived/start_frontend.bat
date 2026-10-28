@echo off
title Start Frontend Server
cd /d "%~dp0frontend"
echo Starting Frontend Server...
call npm run dev
pause
