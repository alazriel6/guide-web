@echo off
setlocal
title PRD ^& Technical Prompt Studio

echo ========================================================
echo   PRD ^& Technical Prompt Studio - Starting App
echo ========================================================
echo.
echo [*] Checking ports 8080 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Starting Go Backend on http://localhost:8080 ...
start /b cmd /c "cd /d "%~dp0backend" && go run ."

echo [*] Initializing backend...
timeout /t 2 /nobreak >nul

echo [*] Starting Vue 3 Frontend on http://localhost:5173 ...
echo.
echo ========================================================
echo   Aplikasi berjalan dalam 1 jendela CMD:
echo   - Backend API : http://localhost:8080
echo   - Frontend UI : http://localhost:5173
echo   (Tekan Ctrl+C untuk keluar/berhenti)
echo ========================================================
echo.

cd /d "%~dp0frontend"
call npm run dev

echo.
echo [*] Menghentikan service background...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
