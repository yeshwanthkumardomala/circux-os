@echo off
setlocal
cd /d "%~dp0"
if "%CIRCUX_ADMIN_TOKEN%"=="" (
  echo No CIRCUX_ADMIN_TOKEN is set for this window.
  set /p CIRCUX_ADMIN_TOKEN=Enter the local admin token: 
)
if "%CIRCUX_ADMIN_TOKEN%"=="" (
  echo Admin token is required.
  pause
  exit /b 1
)
start "Circux FastAPI" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
echo Circux frontend starting at http://localhost:3000
npm.cmd run dev -- --hostname 0.0.0.0
