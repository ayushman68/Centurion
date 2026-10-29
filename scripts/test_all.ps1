# Centurion Validation & Test Runner
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Running Centurion Test & Validation Pipeline" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Frontend Build Validation
Write-Host "`n[1/2] Validating Frontend Bundle Build..." -ForegroundColor Yellow
cd "$PSScriptRoot\..\frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build validated successfully!" -ForegroundColor Green

# 2. Backend Unit Test Validation
Write-Host "`n[2/2] Validating Backend Core Engine..." -ForegroundColor Yellow
cd "$PSScriptRoot\.."
python backend/tests/test_api.py
Write-Host "`nValidation complete!" -ForegroundColor Green
