# Strix Health & Environment Check Script for Antigravity

Write-Host "=== Strix Pentesting Ortam Kontrolu ===" -ForegroundColor Cyan

# 1. Docker Kontrolu
$dockerOk = $false
try {
    $dockerVer = docker --version 2>$null
    if ($LASTEXITCODE -eq 0 -and $dockerVer) {
        Write-Host "  [OK] Docker yuklu: $dockerVer" -ForegroundColor Green
        # Docker daemon aktif mi?
        docker ps >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Docker daemon calisiyor." -ForegroundColor Green
            $dockerOk = $true
        } else {
            Write-Host "  [UYARI] Docker yuklu fakat Docker daemon/servisi calismiyor! Lutfen Docker Desktop'i baslatin." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [HATA] Docker bulunamadi. Strix sandbox icin Docker gereklidir." -ForegroundColor Red
    }
} catch {
    Write-Host "  [HATA] Docker erisilemez durumda." -ForegroundColor Red
}

# 2. Strix CLI Kontrolu
$strixInstalled = $false
try {
    $strixVer = strix --help 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Strix CLI komutu hazir." -ForegroundColor Green
        $strixInstalled = $true
    } else {
        Write-Host "  [BILGI] 'strix' komutu bulunamadi. 'pip install strix-agent' veya 'pipx install strix-agent' ile kurabilirsiniz." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [BILGI] 'strix' komutu bulunamadi." -ForegroundColor Yellow
}

# 3. LLM Ortam Degiskenleri Kontrolu
Write-Host "`n--- LLM Yapilandirma Durumu ---" -ForegroundColor Cyan
if ($env:STRIX_LLM) {
    Write-Host "  [OK] STRIX_LLM: $env:STRIX_LLM" -ForegroundColor Green
} else {
    Write-Host "  [!] STRIX_LLM tanimli degil. (Ornek: `$env:STRIX_LLM = 'gemini/gemini-2.0-flash')" -ForegroundColor Yellow
}

$hasApiKey = $false
if ($env:LLM_API_KEY -or $env:GEMINI_API_KEY -or $env:OPENAI_API_KEY -or $env:ANTHROPIC_API_KEY -or $env:OPENROUTER_API_KEY) {
    Write-Host "  [OK] LLM API anahtari tanimli." -ForegroundColor Green
    $hasApiKey = $true
} else {
    Write-Host "  [!] LLM API anahtari tanimli degil. (GEMINI_API_KEY, OPENAI_API_KEY veya LLM_API_KEY)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($dockerOk -and $strixInstalled -and $hasApiKey) {
    Write-Host "Tebrikler! Strix taramasi baslatmaya hazir: 'strix --target .'" -ForegroundColor Green
} else {
    Write-Host "Eksik adimlari tamamladiktan sonra Strix yetenegini kullanabilirsiniz." -ForegroundColor Yellow
}
