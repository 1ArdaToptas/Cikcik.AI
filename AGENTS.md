# TTS & STT Studio — Proje Kuralları (Project Rules)

Bu dosya, yapay zekânın ve geliştiricilerin bu projede kod yazarken, hata ayıklarken veya yeni özellikler eklerken kesinlikle uyması gereken temel kuralları tanımlar.

---

## 📌 Temel Geliştirme İlkeleri (Zorunlu)

1. **Python 3.11 Uyumluluğu:** Tüm Python kodları Python 3.11 sözdizimi ve standart kütüphaneleriyle tam uyumlu olmalıdır. Sanal ortam: `backend\.venv\Scripts\python.exe`.
2. **Ön İnceleme ve Yapı Analizi:** Kod yazmadan önce mevcut proje yapısı (`view_file` ve dizin analizleriyle) dikkatle incelenir; mimari ve dosya ilişkileri anlaşılmadan değişiklik yapılmaz.
3. **Mevcut Özellikleri Koruma:** Mevcut çalışan özellikler (100k karakter desteği, paralel TTS sentezleme, özel ses klonlama, Whisper STT) gereksiz yere değiştirilmez veya silinmez.
4. **Modülerlik ve Okunabilirlik:** Kodlar modüler, temiz ve okunabilir yazılır; monolitik dosyalardan kaçınılarak sorumluluklarına göre (`services`, `routes`, `schemas`, `core`) ayrıştırılır.
5. **Tek Sorumluluk İlkesi (SRP):** Fonksiyonlar ve sınıflar yalnızca tek bir sorumluluğa ve açık bir amaca sahip olacak şekilde tasarlanır.
6. **Bağımlılık Disiplini:** Yeni bir dependency (paket) eklemeden önce `pyproject.toml` veya `package.json` içindeki mevcut dependency'ler kontrol edilir; gereksiz harici paket eklenmez.
7. **Hata Yönetimi ve Logging:** Beklenmedik durumlar, istisnalar ve hatalar `AppError` sınıfları ve yapılandırılmış logging (`logger.info`, `logger.warning`, `logger.error`) ile yönetilir.
8. **Doğru HTTP Durum Kodları:** API endpoint'lerinde her durum için semantik olarak uygun HTTP status code'ları kullanılır (örn: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 422 Unprocessable Entity, 502 Bad Gateway).
9. **Değişiklik Sonrası Testleri Çalıştırma:** Yapılan her kod değişikliğinden sonra ilgili birim/entegrasyon testleri (`pytest`) ve linter'lar (`ruff`, `oxlint`) çalıştırılarak doğrulanır.
10. **Kök Neden Odaklı Hata Düzeltme:** Bir hata düzeltilirken sadece yüzeysel olarak hatayı gizleyen geçici yamalar yapılmaz; hatanın kök nedeni (root cause) bulunup kalıcı olarak çözülür.
11. **Büyük Değişiklik Öncesi Bilgilendirme:** Kapsamlı refactor veya büyük özellik eklemelerinden önce hangi dosyaların değişeceği ve plan kullanıcıya açıkça raporlanır.
12. **Kod Tekrarını Önleme (DRY):** Gereksiz kod tekrarlarından kaçınılır; ortak işlevler yardımcı fonksiyonlar (`core`, `utils`, `lib`) altında toplanır.
13. **Güvenlik Açıklarına Dikkat:** SQL/komut enjeksiyonu, dosya yolu sızıntısı (path traversal), kontrolsüz dosya yükleme veya bellek taşması gibi güvenlik açıklarına karşı tedbirli olunur.
14. **Hassas Bilgilerin Korunması:** Environment variable, API anahtarları, token veya parola gibi gizli bilgiler asla kaynak kod içine yazılmaz (`.env` ve `Settings` kullanılır).
15. **Türkçe İletişim:** Önemli değişiklikler, hata analizleri ve sonuçlar kullanıcıya anlaşılır bir Türkçe ile raporlanır.

---

## 🛠️ Backend Detay Kuralları (Python / FastAPI)
- **Sanal Ortam:** Python komutları daima `backend\.venv\Scripts\python.exe` kullanılarak çalıştırılmalıdır.
- **Tip Güvenliği:** Tüm fonksiyon ve API endpoint'lerinde tip belirteçleri (type hints) ve Pydantic v2 modelleri kullanılmalıdır. FastAPI dependency'leri için `Annotated` zorunludur.
- **Asenkron Bloklama Yasağı:** Ses analizi (`librosa`), ses sentezleme (`piper`), model yükleme veya dosya I/O gibi ağır CPU işlemleri `async def` içerisinde doğrudan çağrılmamalıdır; daima `await asyncio.to_thread(...)` ile iş parçacığı havuzunda çalıştırılmalıdır.
- **Donanım Kısıtları (CPU-Only):** Sistem Windows üzerinde ve harici CUDA GPU olmadan (CPU-only) çalışmaktadır. Bellek ve CPU optimizasyonları gözetilmelidir.
- **Geçici Dosyalar:** İndirilen YouTube videoları veya geçici ses parçaları işlem bittikten sonra temizlenmelidir (`finally` blokları).

---

## 🎨 Frontend Detay Kuralları (React 19 / TypeScript / Vite / Tailwind 4)
- **TypeScript:** `any` tipi kullanılmamalıdır; API dönüşleri ve bileşen prop'ları için `frontend/src/types.ts` içerisindeki arayüzler kullanılmalıdır.
- **Linter & Derleme:** Kod yazıldıktan sonra `npm --prefix frontend run lint` (Oxlint) çalıştırılmalı ve 0 hata / 0 uyarı garantilenmelidir. `npm --prefix frontend run build` ile TypeScript derlemesi doğrulanmalıdır.
- **Tasarım Dili:** Koyu stüdyo teması (`#16171b` arka plan, panel efektleri, Lucide ikonları) korunmalıdır.
- **Kullanıcı Geri Bildirimi:** Uzun süren işlemlerde mutlaka yükleniyor animasyonu (`LoaderCircle`) ve anlaşılır hata kutuları gösterilmelidir.
