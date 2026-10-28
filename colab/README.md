# 🎙️ Cikcik.AI — Google Colab GPU Setup Guide

This guide enables running the **Coqui XTTS v2** voice cloning engine on Google's free **NVIDIA Tesla T4 GPU (16 GB)** infrastructure, slashing synthesis latency from **~3.5 minutes down to 2–3 seconds**.

---

### 🚀 3-Step Quick Start

#### 1. Open the Notebook in Google Colab:
1. Open [Google Colab](https://colab.research.google.com) in your web browser.
2. Select the **"Upload"** tab in the initial modal.
3. Select the notebook file from your repository:
   `colab/TTS_Studio_GPU_Colab.ipynb`

#### 2. Select T4 GPU Hardware:
1. In the Colab top navigation menu, open **Edit -> Notebook Settings**.
2. Select **T4 GPU** under **Hardware accelerator** and click **Save**.

#### 3. Run All Cells:
1. From the top menu, click **Runtime -> Run all** (or press `Ctrl + F9`).
2. Within ~1 minute, the model will be loaded into GPU memory, and a public live tunnel link will be displayed under the last cell:
   ```text
   Running on public URL: https://xxxx.gradio.live
   ```
3. Open this link to access the studio:
   - Upload your 3–10s reference audio sample,
   - Enter your target text,
   - Click **Synthesize**.
   - **Your cloned neural audio will be ready in 2–3 seconds!**
