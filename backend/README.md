# ⚙️ Cikcik.AI — Backend API

Enterprise-grade asynchronous audio processing backend built with **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **Uvicorn**.

For comprehensive setup details, see the root [README.md](../README.md).

---

## 📂 Architecture

| Directory / File | Description |
| :--- | :--- |
| `app/api/routes` | FastAPI endpoints for TTS synthesis, STT transcription, voice registry, and health checks |
| `app/core` | Application settings, CORS policies, CSP security middleware, rate limiter, and logging |
| `app/data` | Pre-configured voice catalog and language mappings |
| `app/schemas` | Strict Pydantic v2 request/response validation models |
| `app/services` | Multi-engine adapters: Edge Neural TTS, Piper TTS (ONNX), Whisper STT, and Voice Cloning |
| `app/main.py` | FastAPI application factory, middleware pipeline, and lifecycle events |
| `tests/` | Comprehensive test suite (25/25 unit & integration tests) |

---

## 🛠️ Quick Commands

From the `backend` directory:

```bash
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Run test suite
pytest
```
