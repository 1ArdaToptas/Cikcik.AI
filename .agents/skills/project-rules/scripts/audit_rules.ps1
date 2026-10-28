# Rule Compliance Audit Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TTS & STT Studio - Kural Denetim Raporu" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$hasError = $false

# 1. Backend Linting
Write-Host "`n[1] Backend Kod Stili ve Kural Kontrolü (Ruff)..." -ForegroundColor Yellow
& "backend\.venv\Scripts\python.exe" -m ruff check backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "-> Backend kod stili kurallara uymuyor!" -ForegroundColor Red
    $hasError = $true
} else {
    Write-Host "-> Backend kurallara tam uyumlu." -ForegroundColor Green
}

# 2. Frontend Linting
Write-Host "`n[2] Frontend Kod Stili ve Tip Kontrolü (Oxlint)..." -ForegroundColor Yellow
& npm --prefix frontend run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "-> Frontend kod stili kurallara uymuyor!" -ForegroundColor Red
    $hasError = $true
} else {
    Write-Host "-> Frontend kurallara tam uyumlu." -ForegroundColor Green
}

# 3. Backend Testleri
Write-Host "`n[3] Backend Birim ve Entegrasyon Testleri..." -ForegroundColor Yellow
& "backend\.venv\Scripts\python.exe" -m pytest backend/tests --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "-> Testlerde başarısızlık tespit edildi!" -ForegroundColor Red
    $hasError = $true
} else {
    Write-Host "-> Tüm testler başarıyla geçti." -ForegroundColor Green
}

# 4. Frontend Derleme
Write-Host "`n[4] Frontend TypeScript Derleme Bütünlüğü..." -ForegroundColor Yellow
& npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "-> Frontend derlemesi başarısız!" -ForegroundColor Red
    $hasError = $true
} else {
    Write-Host "-> Frontend derlemesi hatasız." -ForegroundColor Green
}

Write-Host "`n------------------------------------------" -ForegroundColor Cyan
if ($hasError) {
    Write-Host "SONUÇ: Proje kurallarında ihlaller var. Lütfen yukarıdaki hataları düzeltin." -ForegroundColor Red
    exit 1
} else {
    Write-Host "SONUÇ: Harika! Proje tüm mimari ve kod kurallarına %100 uyuyor." -ForegroundColor Green
    exit 0
}
