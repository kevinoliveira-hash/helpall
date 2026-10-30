@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "$taskDirectory = (Get-Location).Path; try { $existing = Invoke-WebRequest 'http://localhost:4173' -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop } catch { Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $taskDirectory -WindowStyle Hidden; for ($attempt = 0; $attempt -lt 30; $attempt++) { try { $ready = Invoke-WebRequest 'http://localhost:4173' -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop; break } catch { Start-Sleep -Milliseconds 200 } } }; Start-Process 'http://localhost:4173'"
