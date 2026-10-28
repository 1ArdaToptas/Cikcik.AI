# 🎙️ TTS & STT Studio — Google Colab GPU Kurulum Rehberi

Bu rehber, **Coqui XTTS v2** ses klonlama motorunu Google'ın ücretsiz **NVIDIA Tesla T4 GPU (16 GB)** altyapısında çalıştırarak ses sentezleme süresini **3.5 dakikadan 2-3 saniyeye** düşürmenizi sağlar.

---

### 🚀 3 Adımda Başlatma

#### 1. Not Defterini Colab'da Açın:
1. Tarayıcınızda [Google Colab](https://colab.research.google.com)'ı açın.
2. Açılan pencerede **"Yükle" (Upload)** sekmesine tıklayın.
3. Bilgisayarınızdaki bu dosyayı seçin:
   `c:\Users\ardat\cursor project\tts-app\colab\TTS_Studio_GPU_Colab.ipynb`

#### 2. T4 GPU'yu Seçin:
1. Colab üst menüsünden **Düzenle (Edit) -> Not Defteri Ayarları (Notebook Settings)** bölümüne gidin.
2. **Donanım Hızlandırıcı (Hardware Accelerator)** olarak **T4 GPU** seçildiğinden emin olun ve Kaydet'e basın.

#### 3. Tüm Hücreleri Çalıştırın:
1. Üst menüden **Çalışma Zamanı (Runtime) -> Tümünü Çalıştır (Run all)** seçeneğine tıklayın (veya `Ctrl + F9`).
2. Yaklaşık 1 dakika içinde model GPU belleğine yüklenecek ve hücrenin altında size özel bir bağlantı oluşacaktır:
   ```text
   Running on public URL: https://xxxx.gradio.live
   ```
3. Bu bağlantıya tıkladığınızda stüdyo ekranı açılır:
   * Referans sesinizi yükleyin,
   * Metninizi girin,
   * **Sentezle** butonuna basın.
   * **Süre: 2 - 3 saniye içinde sesiniz hazır!**
