# 🐥 Cikcik.AI — Neural Text-to-Speech, Voice Cloning & Transcription Studio

> *"You speak, Cikcik writes. You write, Cikcik speaks."*

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-v4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff69b4?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Cikcik.AI** is an all-in-one, privacy-focused neural audio workstation capable of seamless long-form text-to-speech synthesis up to **100,000 characters**, instant **voice cloning** with a single audio sample, and lightning-fast **speech-to-text (STT)** from YouTube URLs or local audio files powered by OpenAI Whisper.

---

## 🌟 Key Features

### 1. 🎙️ 100,000 Character Neural Text-to-Speech (TTS)
- **Intelligent Sentence Boundary Chunking:** Splits extensive book chapters, reports, or articles into natural linguistic pauses, synthesizes audio chunks concurrently, and stitches them seamlessly into single audio files without glitches.
- **Diverse Neural Voices:**
  - **Turkish:** Ahmet (Fluid & Natural), Emel (Warm & Articulate), Çınar (Meta AI), Piper Turkish (Local / Offline ONNX).
  - **English:** Jenny & Guy (US Studio Quality), Aria & Fenrir (Kokoro AI), Brian & Sonia (UK British Studio), Jessie & Joey (Viral TikTok tone).
- **Live % Progress & ETA Countdown:** Real-time synthesis progress bar, phoneme processing indicators, and remaining time countdown.

### 2. 🧬 Custom Voice Cloning Studio
- Clone any voice using just a **3 to 10-second reference audio clip** or direct microphone recording.
- Pitch/F0 contour extraction and timbre modeling allow immediate synthesis of custom text using the cloned identity.

### 3. ✍️ Whisper Speech-to-Text (STT) & Video Transcription
- **YouTube & Web Video Extraction:** Paste any YouTube or video URL to fetch and transcribe audio directly via `yt-dlp`.
- **Local File Uploads:** Supports drag-and-drop for MP3, WAV, M4A, OGG, and FLAC audio files.
- **Live Microphone Studio:** Live audio waveform visualization with instant transcription.
- **Export & Translation:** Timestamped subtitles (exportable as SRT, VTT, TXT) and multilingual AI translation.

### 4. 🎛️ Studio Audio Player & Archive Management
- **Precision Volume Controls:** Smooth volume slider, one-click mute/unmute toggle, and persistent volume state.
- **Speed Control:** Variable playback rate from 0.5× to 2.0× with quick-preset chips.
- **Individual Item Deletion:** Remove single audio or transcription records with confirmation modals, or purge history in bulk.
- **IndexedDB Local Storage:** High-capacity client-side caching ensures generated audio blobs and history persist across browser refreshes and offline sessions.

### 5. 🎨 3 Premium Themes & WCAG AA Accessibility
- **Light Mode:** Warm Cambly cream background (`#FAF4EB`) with high-contrast charcoal text.
- **Dark Mode:** Deep studio black (`#000000`) with electric yellow accents (`#FFE733`).
- **Sakura Mode:** Soft cherry blossom pink (`#FFF5F8`) with rich plum ink contrast.

### 6. 📱 Progressive Web App (PWA)
- Full PWA installation support on desktop (Chrome, Edge, Safari) and mobile devices.
- Custom service worker (`sw.js`) provides static asset caching and offline resilience.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4 |
| **UI Components** | Radix UI Primitives, Lucide Icons, Magic UI, React Bits |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **TTS Engines** | Microsoft Edge Neural TTS, Piper TTS (Local ONNX), Custom Voice Cloning (Librosa / SoundFile) |
| **STT Engines** | OpenAI Whisper / Faster-Whisper, `yt-dlp`, PyDub |
| **Security** | Strict CSP headers, CORS origin whitelisting, In-memory Rate Limiting |
| **Persistence** | IndexedDB (Audio Blob Cache), LocalStorage (Metadata & Settings), JSON Voice Catalog |

---

## 📂 Project Structure

```
tts-app/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI endpoints (TTS, STT, Voices, Health)
│   │   ├── core/                # Settings, CSP headers, rate limiting, logging
│   │   ├── data/                # Voice registry & language definitions
│   │   ├── schemas/             # Pydantic v2 request/response models
│   │   ├── services/            # Edge TTS, Piper, Whisper, Voice Cloning services
│   │   └── main.py              # Application entry point & middleware
│   ├── tests/                   # Pytest suite (25/25 passing)
│   └── pyproject.toml           # Python dependencies and build config
├── frontend/
│   ├── public/                  # Favicon, app icons, web manifest, sw.js (PWA)
│   ├── src/
│   │   ├── components/          # AudioPlayer, Modals, Mascot, Radix Primitives
│   │   ├── context/             # StudioContext, LanguageContext
│   │   ├── pages/               # HomePage, TextToSpeech, SpeechToText, VoiceStudio, History
│   │   ├── lib/                 # IndexedDB audioStorage, ttsApi client, formatters
│   │   └── index.css            # Tailwind 4 theme tokens and animations
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python:** 3.11 (Windows x64 / Linux / macOS)
- **Node.js:** 20+ and `npm`
- **FFmpeg:** Must be installed and accessible in your system's `PATH`.

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy example environment configuration
copy .env.example .env    # Windows
# cp .env.example .env    # Linux/macOS

# Start the FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Base URL:** `http://127.0.0.1:8000`
- **Swagger Documentation:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/health`

---

### 2. Frontend Setup

Open a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Application URL:** `http://localhost:5173`

---

## 🧪 Testing & Code Quality

The entire repository enforces strict type-safety and linting standards.

### Backend Tests (Pytest)
```bash
cd backend
.venv\Scripts\activate
pytest
```
> **Status:** 25 passed in ~68s (TTS streaming, security headers, rate limiting, and cloning tests).

### Frontend Linting & Build (Oxlint & Vite)
```bash
cd frontend

# Run Oxlint (0 errors / 0 warnings)
npm run lint

# TypeScript compilation & production build
npm run build
```

---

## 🔒 Security & Privacy

- **Content Security Policy (CSP):** Configured with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, and restrictive media source controls.
- **CORS Protection:** Restricted strictly to trusted origins.
- **Rate Limiting:** In-memory IP-based protection preventing API abuse.
- **Auto-Cleanup:** Temporary audio downloads (such as YouTube streams) are immediately deleted after processing in `finally` execution blocks.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Copyright © 2026 **Cikcik.AI**. All rights reserved.
