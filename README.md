# 🐥 Cikcilk.AI — Nöral Seslendirme, Ses Klonlama ve Akıllı Transkripsiyon Stüdyosu

> *"Sen konuş, Cikcilk yazsın."*

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff69b4?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Cikcilk.AI**, 100.000 karaktere kadar kesintisiz ve doğal metinden sese (TTS) dönüştürme, tek örnekle özel yapay zekâ ses klonlama, YouTube ve dosyalardan Whisper yapay zekâsı ile anında deşifre (STT) yapabilen kurumsal kalitede bir ses stüdyosu platformudur.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🎙️ 100.000 Karakter Nöral Metinden Sese (TTS)
- **Akıllı Cümle Ayrıştırma:** 100K karaktere kadar olan uzun kitap bölümlerini ve makaleleri teklemeyen doğal nefes duraklarıyla parçalar ve kusursuz şekilde dikişsiz (seamless) birleştirir.
- **Zengin Ses Kataloğu:**
  - **Türkçe:** Ahmet (Akıcı & Doğal), Emel (Sıcak & Net), Çınar (Meta AI), Piper Türkçe (Yerel / İnternetsiz).
  - **İngilizce:** Jenny & Guy (US Studio), Aria & Fenrir (Kokoro AI), Brian & Sonia (UK British Studio), Jessie & Joey (TikTok Viral).
- **Canlı Yüzde (%) ve Tahmini Süre Sayacı:** Sentezleme işlemi sırasında anlık ilerleme çubuğu, fonem analiz aşamaları ve kalan süre geri sayımı.

### 2. 🧬 Özel Ses Klonlama Stüdyosu (Voice Cloning)
- Bilgisayarınızdan yükleyeceğiniz veya mikrofonla kaydedeceğiniz **3-10 saniyelik referans ses** ile kişisel ses karakterinizi klonlayın.
- Pitch/F0 frekans analizi ve ses tınısı eşleştirmesi ile klonlanan sesleri metin seslendirmede hemen kullanın.

### 3. ✍️ Whisper STT (Sesten Metne Çevirici)
- **YouTube & Video URL Çevirisi:** `yt-dlp` entegrasyonu sayesinde herhangi bir YouTube veya web video bağlantısını yapıştırarak sesi metne dökün.
- **Ses Dosyası Yükleme:** MP3, WAV, M4A, OGG ve FLAC dosyalarından tam transkripsiyon.
- **Canlı Mikrofon Stüdyosu:** Konuşurken dinamik ses dalga formu (waveform) animasyonları ile anında yazıya döküm.
- **Altyazı ve Çeviri:** Zaman damgalı altyazı üretimi (SRT, VTT, TXT formatlarında dışa aktarma) ve çok dilli yapay zekâ çevirisi.

### 4. 🎛️ Gelişmiş Ses Oynatıcı & Arşiv Yönetimi
- **Hassas Ses Düzeyi Çubuğu (Volume Slider):** Tek tıkla sessize alma (Mute/Unmute) ve kalıcı ses seviyesi hafızası.
- **Çoklu Hız Ayarı:** 0.5× ile 2.0× arası pürüzsüz hız kaydırıcı ve hızlı hız butonları.
- **Tek Tek Silme & Onay Modalları:** İstemediğiniz üretimleri onay penceresiyle tek tek veya geçmişi topluca temizleme imkânı.
- **IndexedDB Depolama:** Üretilen tüm sesler ve transkriptler tarayıcıda yerel olarak önbelleğe alınır, sayfa yenilense de kaybolmaz.

### 5. 🎨 3 Farklı Tasarım Teması & WCAG AA Uyumu
- **Gündüz Modu (Light):** Sıcak Cambly krem (`#FAF4EB`) ve yüksek kontrastlı odun kömürü metinler.
- **Gece Modu (Dark):** Saf siyah (`#000000`), neon sarı (`#FFE733`) vurgular ve stüdyo panelleri.
- **Sakura Modu:** Kiraz çiçeği pudra pembesi (`#FFF5F8`) ve derin mürdüm mürekkep kontrastı.

### 6. 📱 PWA (Progressive Web App) Desteği
- Masaüstü (Chrome, Edge, Safari) ve mobil cihazlarda tek tıkla **"Uygulamayı Yükle"** desteği.
- Service Worker (`sw.js`) ile statik kaynak önbellekleme ve çevrimdışı yedekleme.

---

## 🛠️ Mimari ve Teknoloji Yığını

| Katman | Teknolojiler |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4 |
| **Bileşenler** | Radix UI Primitives, Lucide Icons, Magic UI, React Bits |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **TTS Motorları** | Microsoft Edge Neural TTS, Piper TTS (Yerel ONNX), Voice Cloning (Librosa / SoundFile) |
| **STT Motorları** | OpenAI Whisper / Faster-Whisper, `yt-dlp`, PyDub |
| **Güvenlik** | CSP (Content Security Policy) başlıkları, CORS whitelist, In-memory Rate Limiting |
| **Veri Depolama**| IndexedDB (Audio Blob cache), LocalStorage (Metadata), JSON Catalog |

---

## 📂 Proje Dizin Yapısı

```
tts-app/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI TTS, STT, Voices, Health rotaları
│   │   ├── core/                # Ayarlar, güvenlik (CSP), rate limit, logging
│   │   ├── data/                # Ses kataloğu ve desteklenen diller
│   │   ├── schemas/             # Pydantic v2 modelleri
│   │   ├── services/            # Edge, Piper, Whisper, Voice Cloning servisleri
│   │   └── main.py              # Uygulama giriş noktası ve middleware'ler
│   ├── tests/                   # Pytest birim ve güvenlik testleri (25/25 passed)
│   └── pyproject.toml           # Python bağımlılıkları ve konfigürasyon
├── frontend/
│   ├── public/                  # Favicon, logo, manifest, sw.js (PWA)
│   ├── src/
│   │   ├── components/          # AudioPlayer, Modal, Mascott, Radix Primitives
│   │   ├── context/             # StudioContext, LanguageContext
│   │   ├── pages/               # HomePage, TextToSpeech, SpeechToText, CicikStudio, History
│   │   ├── lib/                 # IndexedDB audioStorage, ttsApi, format araçları
│   │   └── index.css            # Tailwind 4 tema değişkenleri ve animasyonlar
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Hızlı Başlangıç & Kurulum

### Ön Gereksinimler
- **Python:** 3.11 (Windows x64)
- **Node.js:** 20+ ve `npm`
- **FFmpeg:** Sistem ortam değişkenlerine (PATH) eklenmiş olmalıdır.

---

### 1. Backend Kurulumu

```powershell
# Backend klasörüne geçin
cd backend

# Sanal ortamı oluşturun ve etkinleştirin
python -m venv .venv
.venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Örnek ortam değişkenlerini kopyalayın
copy .env.example .env

# Sunucuyu başlatın
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Adresi:** <http://127.0.0.1:8000>
- **Swagger Dokümantasyonu:** <http://127.0.0.1:8000/docs>
- **Sağlık Kontrolü:** <http://127.0.0.1:8000/api/health>

---

### 2. Frontend Kurulumu

Yeni bir terminal açın:

```powershell
# Frontend klasörüne geçin
cd frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

- **Web Arayüzü:** <http://localhost:5173>

---

## 🧪 Testler ve Kod Kalitesi

Tüm kod tabanı sıkı tip güvenliği ve linter kurallarına tabidir.

### Backend Testleri (Pytest)
```powershell
cd backend
.venv\Scripts\activate
pytest
```
> **Sonuç:** 25 passed in ~68s (TTS akışı, güvenlik başlıkları, rate limiting ve klonlama testleri dahil).

### Frontend Tip & Lint Kontrolleri (Oxlint & Vite)
```powershell
cd frontend

# Oxlint Linter (0 hata / 0 uyarı)
npm run lint

# TypeScript derlemesi & Vite üretim build'i
npm run build
```

---

## 🔒 Güvenlik

- **Content Security Policy (CSP):** `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` ve güvenli script/medya kaynakları yapılandırılmıştır.
- **CORS Koruması:** Sadece izin verilen yerel ve canlı domain'lere açık CORS yapılandırması.
- **Hız Sınırlaması (Rate Limiting):** API kötüye kullanımına ve brute-force'a karşı in-memory IP bazlı koruma.
- **Geçici Dosya Temizliği:** İndirilen YouTube ve ses parçaları işlendikten sonra `finally` bloklarında otomatik olarak silinir.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) kapsamında lisanslanmıştır.
Tüm hakları saklıdır © 2026 **Cikcilk.AI**.
