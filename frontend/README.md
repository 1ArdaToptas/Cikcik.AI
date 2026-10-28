# 🎨 Cikcik.AI — Frontend

Modern, high-performance web interface for the **Cikcik.AI** studio built with **React 19**, **TypeScript 5.9**, **Vite 8**, and **Tailwind CSS v4**.

For complete application overview and setup instructions, please refer to the root [README.md](../README.md).

---

## 📂 Architecture & Directory Structure

| Directory / File | Description |
| :--- | :--- |
| `src/pages` | Primary views: Dashboard, Neural TTS, Whisper STT, Voice Studio, and History |
| `src/components` | Studio AudioPlayer, Mascot, Dialogs, Theme Toggles, and Radix UI Primitives |
| `src/context/StudioContext.tsx` | Global state management for audio jobs, voice catalog, and local history |
| `src/context/LanguageContext.tsx` | Localization support (Turkish & English) |
| `src/lib/ttsApi.ts` | Type-safe REST client for backend FastAPI communication |
| `src/lib/audioStore.ts` | High-capacity IndexedDB storage for offline persistence of generated audio blobs |
| `src/index.css` | Custom theme variables (Light, Studio Dark, Sakura) and animations |

---

## 🛠️ Quick Commands

From the `frontend` directory:

```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run Oxlint (0 errors / 0 warnings required)
npm run lint

# Compile TypeScript and create production bundle
npm run build
```
