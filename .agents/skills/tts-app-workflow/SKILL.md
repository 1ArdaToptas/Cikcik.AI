---
name: tts-app-workflow
description: >-
  Comprehensive guide and runbook for managing, testing, developing, and deploying the
  TTS (Text-to-Speech) and STT (Speech-to-Text) Studio application. Use this skill
  whenever the user asks to test the app, verify code quality, check audio services,
  add new voices, or manage the backend and frontend.
---

# TTS & STT Studio Uygulama Yönetim ve Geliştirme Kılavuzu

Bu skill, TTS & STT Studio projesinde geliştirme yaparken, hata ayıklarken veya projeyi test ederken takip edilmesi gereken standart iş akışlarını tanımlar.

---

## 1. Hızlı Doğrulama ve Test Çalıştırma

Projede yapılan değişikliklerin backend veya frontend'i bozmadığından emin olmak için otomatik doğrulama betiğini çalıştırın:

- **Toplu Doğrulama Betiği:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .agents/skills/tts-app-workflow/scripts/verify_all.ps1
  ```

### Ayrı Ayrı Komutlar:
1. **Backend Linter Kontrolü (Ruff):**
   ```powershell
   backend\.venv\Scripts\python.exe -m ruff check backend
   ```
2. **Backend Pytest Testleri:**
   ```powershell
   backend\.venv\Scripts\python.exe -m pytest backend/tests
   ```
3. **Frontend Linter Kontrolü (Oxlint):**
   ```powershell
   npm --prefix frontend run lint
   ```
4. **Frontend TypeScript & Vite Derlemesi:**
   ```powershell
   npm --prefix frontend run build
   ```

---

## 2. Sunucuları Başlatma (Development)

Uygulama iki bağımsız parçadan oluşur:

### Backend (FastAPI, Port 8000)
```powershell
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
- API Dokümantasyonu: `http://127.0.0.1:8000/docs`
- Sağlık Kontrolü: `http://127.0.0.1:8000/api/health`

### Frontend (React + Vite, Port 5173)
```powershell
npm --prefix frontend run dev
```
- Arayüz Adresi: `http://127.0.0.1:5173`

---

## 3. Mimari Bileşenler ve Konfigürasyon

| Bileşen | Konum | Açıklama |
| :--- | :--- | :--- |
| **Edge Neural TTS** | `backend/app/services/edge.py` | Microsoft Edge tabanlı ultra akıcı Türkçe & İngilizce nöral sesler |
| **Özel Ses Klonlama** | `backend/app/services/voice_cloning.py` | CPU üzerinde akustik frekans (f0) ve tını morflama |
| **Özel Ses Deposu** | `backend/custom_voices/` | Yüklenen kullanıcı ses kayıtları ve `voices.json` indeksi |
| **STT (Faster-Whisper)** | `backend/app/services/stt.py` | Hızlı ses ve YouTube/video transkripsiyonu |
| **Ses Kataloğu** | `backend/app/data/catalog.py` | Desteklenen diller ve hazır ses profilleri |
| **Kullanıcı Arayüzü** | `frontend/src/pages/` | `TextToSpeech.tsx`, `SpeechToText.tsx`, `Dashboard.tsx` |

---

## 4. Yeni Ses Eklerken Dikkat Edilecek Noktalar
- Kataloğa yeni bir hazır Edge sesi eklerken `backend/app/data/catalog.py` dosyasındaki `VOICES` listesine ve `EDGE_VOICE_MAP` sözlüğüne ses tanımını ekleyin.
- Kullanıcıların yüklediği özel sesler otomatik olarak `backend/custom_voices/voices.json` dosyasına yazılır ve `/api/voices` sorgusunda dinamik olarak birleştirilir.
