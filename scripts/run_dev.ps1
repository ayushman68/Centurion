# Centurion Local Development Startup Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Centurion Institutional Risk Engine - Launching Services" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background
Write-Host "`n[1/2] Starting Python FastAPI Backend Engine on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Vite Frontend
Write-Host "`n[2/2] Starting React Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
cd "$PSScriptRoot\..\frontend"
npm run dev
