$ErrorActionPreference = 'Stop'
$backend = Start-Process python -ArgumentList '-m','uvicorn','backend.app.main:app','--host','0.0.0.0','--port','8000' -PassThru
try {
  npm.cmd run start -- -H 0.0.0.0 -p 3000
} finally {
  Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
}
