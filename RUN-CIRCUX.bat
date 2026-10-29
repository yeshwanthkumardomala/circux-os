@echo off
setlocal
cd /d "%~dp0"

if "%CIRCUX_ADMIN_TOKEN%"=="" (
  for /f "delims=" %%T in ('powershell -NoProfile -Command "$bytes = New-Object byte[] 32; $rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); [BitConverter]::ToString($bytes).Replace('-', '')"') do set "CIRCUX_ADMIN_TOKEN=%%T"
)
echo Circux admin token for this session: %CIRCUX_ADMIN_TOKEN%
echo Keep this token private. The browser will ask for it when accessing protected features.

if not exist node_modules (
  echo Node dependencies are missing. Run npm install first.
  pause
  exit /b 1
)

if not exist backend\requirements.txt (
  echo Backend requirements file is missing.
  pause
  exit /b 1
)

start "Circux FastAPI" cmd /k "cd /d "%~dp0" ^&^& python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
echo Starting Circux exhibition at http://localhost:3000/display
npm.cmd run exhibition
