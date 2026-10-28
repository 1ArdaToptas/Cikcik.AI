---
name: strix
description: >-
  Strix AI penetration testing and security assessment skill. Use when the user wants to scan an application
  for security vulnerabilities, run automated AI pentesting, generate working exploit PoCs, perform code security audits,
  integrate security scanning into CI/CD, or remediate security findings using Strix (https://github.com/usestrix/strix).
---

# Strix: Açık Kaynaklı Yapay Zekâ Destekli Sızma Testi (AI Pentesting) Yeteneği

[Strix (usestrix/strix)](https://github.com/usestrix/strix), web uygulamalarınızdaki, kaynak kodlarınızdaki ve API'larınızdaki güvenlik açıklarını tespit edip doğrulayan ve çalışan istismar kanıtları (Proof of Concept - PoC) üreten açık kaynaklı otonom bir AI sızma testi (penetration testing) aracıdır.

Klasik statik analiz (SAST) araçlarının aksine, Strix kodu Docker tabanlı izole bir sandbox ortamında dinamik olarak çalıştırır, gerçek bir etik hacker gibi zafiyetleri tetikler ve sıfır yanlış pozitif (zero false-positives) garantisiyle doğrular.

---

## 🎯 Temel Yetenekler ve Kullanım Alanları

- **Otonom Zafiyet Tespiti:** SQLi, XSS, SSRF, IDOR, RCE, Broken Auth, Path Traversal ve API sızıntılarını tespit eder.
- **Doğrulanmış PoC (Proof-of-Concept):** Yalnızca teorik uyarılar değil, zafiyetin çalıştığını kanıtlayan somut istismar senaryoları üretir.
- **Yerel ve Canlı Hedef Desteği:**
  - Yerel dizin / kaynak kod analizi (`--target ./app-directory`)
  - Canlı web uygulaması / staging URL analizi (`--target https://app.example.com`)
  - GitHub uzak deposu analizi (`--target https://github.com/org/repo`)
- **Otomatik Yama & Düzeltme Rehberi:** Bulunan açıkları kapatmak için kod yamaları ve çözüm yönergeleri sunar.
- **CI/CD Entegrasyonu:** Headless / etkileşimsiz mod (`-n, --non-interactive`) ile pipeline'larda güvensiz kodun üretime geçmesini engeller.

---

## 🛠️ Önkoşullar

1. **Docker:** Kodları güvenli bir sandbox ortamında çalıştırmak için Docker masaüstü / arka plan servisi aktif olmalıdır.
2. **LLM API Anahtarı:** OpenAI, Anthropic, Google Gemini veya OpenRouter gibi desteklenen bir AI sağlayıcısının anahtarı.

---

## 📦 Kurulum Seçenekleri

Strix'i sisteminize kurmak için aşağıdaki yöntemlerden birini tercih edebilirsiniz:

### Yöntem A: Hızlı Script ile Kurulum (Önerilen)
```bash
# Linux / macOS / WSL
curl -sSL https://strix.ai/install | bash
```

### Yöntem B: Python / Pipx / Uv ile Kurulum
```bash
# Pipx ile izole kurulum:
pipx install strix-agent

# veya Python pip ile:
pip install strix-agent

# veya uv tool ile:
uv tool install strix-agent
```

### Güncelleme:
```bash
strix --update
```

---

## ⚙️ Yapılandırma (LLM Sağlayıcıları)

Strix çalıştırılmadan önce kullanılacak yapay zekâ modeli ve API anahtarı ortam değişkeni olarak tanımlanmalıdır:

### 1. Google Gemini (Hızlı & Yetenekli):
```powershell
$env:STRIX_LLM = "gemini/gemini-2.0-flash"  # veya gemini/gemini-2.5-pro
$env:GEMINI_API_KEY = "AIzaSy..."
```

### 2. OpenAI:
```powershell
$env:STRIX_LLM = "openai/gpt-4o"  # veya openai/o3-mini
$env:OPENAI_API_KEY = "sk-..."
```

### 3. Anthropic Claude:
```powershell
$env:STRIX_LLM = "anthropic/claude-3-7-sonnet-20250219"
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

### 4. OpenRouter:
```powershell
$env:STRIX_LLM = "openrouter/anthropic/claude-3.5-sonnet"
$env:OPENROUTER_API_KEY = "sk-or-..."
```

---

## 🚀 Standart İş Akışı & CLI Komutları

### 1. Yerel Kaynak Kod Taraması (Beyaz Kutu - Whitebox)
Yerel projenizin kaynak kodunu doğrudan inceleyip test etmek için:
```powershell
strix --target .
```

### 2. Canlı Uygulama / Web Sitesi Taraması (Siyah Kutu - Blackbox)
Çalışan bir web servisi veya yerel sunucuyu test etmek için:
```powershell
strix --target http://localhost:8000
# veya canlı domain:
strix --target https://test.your-app.com
```

### 3. Kombine / Çoklu Hedef Taraması (Gri Kutu - Greybox)
Hem kaynak kodu hem çalışan canlı URL'yi birlikte vererek en derin analizi elde etme:
```powershell
strix -t . -t http://localhost:8000
```

### 4. Otomasyon & CI/CD Modu (Etkileşimsiz / Headless)
Boru hatlarında (GitHub Actions vb.) interaktif TUI ekranı açılmadan rapor üretilmesi için:
```powershell
strix --target . --non-interactive --scan-mode standard
```

**Çıkış Kodları (Exit Codes):**
- `0`: Tarama temiz, kritik güvenlik açığı bulunamadı.
- `1`: Çalışma zamanı hatası.
- `2`: Güvenlik zafiyeti tespit edildi.
- `4`: Kimlik doğrulama gerekiyor.

### 5. Ekstra Dosya Enjeksiyonu (`--workspace-file`)
Özel bir OpenAPI şeması, Postman koleksiyonu veya yetki listesi eklemek için:
```powershell
strix --target . --workspace-file ./openapi.json
```

---

## 📊 Rapor ve Çıktıların Konumu

Strix tarama sonuçlarını, tespit edilen açıkların detaylarını ve PoC istismar kodlarını otomatik olarak proje kökünde şu dizinde saklar:
```
strix_runs/
  └── <run-adi-ve-tarih>/
        ├── report.pdf / report.md  (Detaylı güvenlik raporu)
        ├── findings.json           (CVSS skorları ve kanıtlar)
        └── exploits/               (Çalıştırılabilir PoC scriptleri)
```

---

## 💡 Güvenlik Notu & Kurallar

> [!WARNING]
> Strix yalnızca sahip olduğunuz veya test etmek için açıkça yazılı izniniz bulunan sistemler ve repolar üzerinde çalıştırılmalıdır. Üretim (production) ortamlarında veri kaybını önlemek için öncelikle staging veya yerel kopyalar üzerinde test yapılması önerilir.
