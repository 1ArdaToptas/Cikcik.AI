# Automated Verification Script for TTS & STT App
$ErrorActionPreference = "Stop"

Write-Host "=== [1/4] Python Ruff Linter Denetleniyor ===" -ForegroundColor Cyan
& "backend\.venv\Scripts\python.exe" -m ruff check backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ruff kontrolünde hatalar bulundu!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== [2/4] Backend Pytest Testleri Calistiriliyor ===" -ForegroundColor Cyan
& "backend\.venv\Scripts\python.exe" -m pytest backend/tests
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pytest testleri basarisiz oldu!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== [3/4] Frontend Oxlint Linter Denetleniyor ===" -ForegroundColor Cyan
& npm --prefix frontend run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend lint kontrolünde hatalar bulundu!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== [4/4] Frontend Vite & TypeScript Derlemesi Yapiliyor ===" -ForegroundColor Cyan
& npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build basarisiz oldu!" -ForegroundColor Red
    exit 1
}

Write-Host "`n>>> Tebrikler! Tüm kontroller ve testler başarıyla geçti. <<<" -ForegroundColor Green
