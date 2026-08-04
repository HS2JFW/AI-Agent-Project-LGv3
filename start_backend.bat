@echo off
title Start Backend Server
cd /d "%~dp0backend_node"
echo Starting Backend Server...
call npm run dev
pause
