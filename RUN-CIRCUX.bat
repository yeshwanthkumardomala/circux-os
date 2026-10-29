@echo off
setlocal
cd /d "%~dp0"
if "%CIRCUX_ADMIN_TOKEN%"=="" for /f "delims=" %%T in ('powershell -NoProfile -Command "[Convert]::ToBase64String((1..32 ^| ForEach-Object { Get-Random -Maximum 256 }))"') do set "CIRCUX_ADMIN_TOKEN=%%T"
echo Local admin token created for this run: %CIRCUX_ADMIN_TOKEN%
start "Circux FastAPI" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
echo Circux frontend starting at http://localhost:3000
npm.cmd run dev -- --hostname 0.0.0.0
