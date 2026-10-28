# Resonant AI Studio — Design System (DESIGN.md)

> **Stitch Semantic Design System Specification**  
> Bu doküman, **Resonant AI (TTS & STT Studio)** projesinin görsel kimliğini, renk paletini, tipografi hiyerarşisini, aralıklarını ve bileşen tasarım kurallarını tek bir kaynakta toplar. Google Stitch ve AI tasarım ajanları için rehber niteliğindedir.

---

## 🌌 1. Görsel Tema & Atmosfer (Visual Theme & Atmosphere)

- **Genel Ruh Hali (Mood):** Koyu tema profesyonel ses stüdyosu iş istasyonu (Cyber-Audio Workstation). Dikkat dağıtmayan, yüksek kontrastlı, gece kullanımına ve uzun saatler ders çalışmaya uygun, modern ve rafine bir karanlık arayüz.
- **Yüzey Felsefesi:** Katmanlı siyah ve antrasit tonlar üzerine mikro-şeffaf sınırlar (`border-white/8`, `border-white/12`) ve cam efekti (`backdrop-blur-sm`).
- **Renk Sıcaklığı:** Nötr tonlar sıcak kağıt dokusuyla (`#f4f0e6` Warm Ink) dengelenmiş; enerji ve aksiyon noktalarında ise yüksek görünürlüklü neon sitron lime (`#d8f25a`) ve yapay zekâ moru (`#a855f7`) ile vurgulanmıştır.

---

## 🎨 2. Renk Paleti ve Rolleri (Color Palette & Tokens)

Tailwind v4 `@theme` katmanında ve CSS değişkenlerinde tanımlanan renk sistemi:

### A. Temel Yüzey ve Zemin Renkleri (Foundation & Surfaces)
| Token Adı | Hex Değeri | Rolü & Kullanım Alanı |
| :--- | :--- | :--- |
| `--color-canvas` | `#08080a` | **Deep Void Pitch Black** — Uygulama ana arka planı (`body`). |
| `--color-sidebar` | `#0b0b0d` | **Obsidian Near-Black** — Sol gezinme menüsü ve sabit kenar çubuğu. |
| `--color-panel` | `#111114` | **Studio Charcoal** — Ana kartlar, editör panelleri ve modül kutuları. |
| Surface Modal | `#16171b` | **Elevated Dark Slate** — Açılır pencereler (Modal) ve yüzen diyaloglar. |
| Border Standard | `rgba(255, 255, 255, 0.08)` | **Subtle Border** — Kart ve panel kenar çizgileri (`border-white/8`). |
| Border Hover | `rgba(255, 255, 255, 0.16)` | **Interactive Border** — Tıklanabilir kartların hover anındaki çerçevesi. |

### B. Vurgu ve Etkileşim Renkleri (Accents & Interactive)
| Token Adı | Hex Değeri | Rolü & Kullanım Alanı |
| :--- | :--- | :--- |
| `--color-accent` | `#d8f25a` | **Electric Citron Lime** — Ana CTA butonu ("Seslendir"), aktif scrubber başlığı, canlı rozetler. |
| `--color-accent-ink` | `#14160c` | **Dark Olive Black** — Accent (açık sarı-yeşil) butonların üzerindeki yüksek kontrastlı metin rengi. |
| `--color-accent/10` | `rgba(216, 242, 90, 0.10)` | **Accent Glow Tint** — Seçili ses kartı arka planı ve aktif sekme vurgusu. |
| Violet Glow | `#a855f7` | **Electric Purple / Violet** — Özel Ses Klonlama, AI özellikleri ve klonlanmış ses etiketleri. |

### C. Tipografi ve Metin Renkleri (Typography Colors)
| Token Adı | Hex Değeri | Rolü & Kullanım Alanı |
| :--- | :--- | :--- |
| `--color-ink` | `#f4f0e6` | **Warm Paper Cream** — Birincil başlıklar, ana metinler ve okunabilir içerik. |
| `--color-mute` | `#8e8a80` | **Warm Slate Gray** — İkincil metinler, açıklamalar, ipuçları ve pasif sayaçlar. |
| Text Danger | `#f87171` | **Alert Red** — Limit aşımı, mikrofon kayıt sayacı ve silme butonları. |
| Text Success | `#34d399` | **Emerald Green** — Dosya seçildi onayı ve başarılı işlem bildirimleri. |

### D. Dinamik Ses Avatar Gradyanları (Voice Avatar Accents)
Karakterleri görsel olarak birbirinden ayırmak için kullanılan deterministik hash gradyanları:
- Turkuaz/Gökyüzü: `from-teal-400/80 to-sky-500/40`
- Fuşya/Gül: `from-fuchsia-400/80 to-rose-500/40`
- Kehribar/Turuncu: `from-amber-300/80 to-orange-500/40`
- Limon/Zümrüt: `from-lime-300/80 to-emerald-500/40`
- İndigo/Camgöbeği: `from-indigo-400/80 to-cyan-500/40`
- Mor/Pembe: `from-purple-400/80 to-pink-500/40`
- Klonlanmış Ses: `from-purple-500 to-indigo-600` (Özel mor-lila gradyan)

---

## 🔤 3. Tipografi Hiyerarşisi (Typography Hierarchy)

İki ana font ailesi kullanılır:

1. **`Outfit` (Sans-Serif):** Google Fonts üzerinden yüklenir. Geometrik, modern ve sıcak bir başlık ve gövde fontu.
2. **`IBM Plex Mono` (Monospace):** Süre sayaçları, karakter limitleri (`42/100000`), oynatıcı saatleri (`00:15`) ve hız katsayıları (`1.00×`) için kullanılan teknik font.

```css
--font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, monospace;
```

### Tipografi Skalası:

| Seviye | Boyut & Ağırlık | Harf Aralığı (Tracking) | Örnek Kullanım Alanı |
| :--- | :--- | :--- | :--- |
| **Eyebrow / Overline** | `text-[11px] font-medium` | `tracking-[0.18em]` (Genişletilmiş) | `"METİN"`, `"SES SEÇENEKLERİ"`, `"DİL"` bölüm etiketleri |
| **Hero Title (H1)** | `text-3xl sm:text-4xl font-semibold` | `tracking-tight` (-0.02em) | Dashboard ana stüdyo karşılama başlığı |
| **Panel Title (H2)** | `text-xl font-semibold` | `tracking-tight` | `"Ne söylensin?"`, `"Karakter ve Ton"` |
| **Card Title / Lead** | `text-sm font-semibold` | `tracking-normal` | Ses adı ("Ahmet (Akıcı & Doğal)"), metin listesi öğesi |
| **Body Text** | `text-sm sm:text-[15px] leading-7` | `tracking-normal` | Metin giriş alanı (`textarea`), makale paragrafları |
| **Caption / Subtitle** | `text-xs text-mute` | `tracking-normal` | Ses açıklaması ("Haber, Anlatım & Profesyonel") |
| **Technical Counters** | `font-mono text-[11px] / text-sm` | `tracking-normal` | `"42/100000"` karakter sayısı, `"1.25×"` hız değeri |

---

## 📐 4. Aralıklar, Izgara ve Düzen (Spacing, Grid & Layout)

- **Maksimum Genişlik:** `max-w-6xl` (1152px) ortalanmış konteyner (`mx-auto`).
- **Çalışma Alanı Izgarası:** 
  - Masaüstü: `lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]` (Geniş Giriş Paneli + Sağ Geçmiş/Oynatıcı Paneli).
  - Mobil: Tek sütun dikey akış (`flex flex-col gap-6`).
- **Kenar Boşlukları (Padding):**
  - Sayfa Panelleri: `p-5 sm:p-6`
  - Hero Tanıtım Kartı: `p-6 sm:p-8`
  - Butonlar ve Girdiler: `px-4 py-2.5` veya `px-5 py-3`
- **Köşe Yuvarlama Standartları (Border Radius):**
  - `rounded-3xl` (24px): Dış paneller, modal pencereleri, hero kartları.
  - `rounded-2xl` (16px): Metin kutusu (`textarea`), ses seçim kartları.
  - `rounded-xl` (12px): Butonlar, açılır menüler (`select`), girdi kutuları.
  - `rounded-full` (999px): Durum rozetleri (badges), seslendir CTA butonu, oynatıcı kontrolleri.

---

## 🔘 5. Bileşen Standartları (Component Patterns)

### A. Butonlar (Buttons)
1. **Primary Action (CTA):**
   ```html
   <button class="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 shadow-lg shadow-accent/15">
     Seslendir
   </button>
   ```
2. **AI / Magic Action:**
   ```html
   <button class="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 hover:brightness-110">
     Sesi Klonla ve Kaydet
   </button>
   ```
3. **Subtle Pill Button:**
   ```html
   <button class="rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25">
     + Kendi Sesini Ekle
   </button>
   ```

### B. Seçim Kartları (Radio Voice Cards)
- **Normal Durum:** `border border-white/8 bg-white/[0.02] hover:border-white/16 rounded-2xl p-4`
- **Seçili Durum (Standart):** `border-accent/50 bg-accent/8 shadow-[0_0_0_1px_rgba(216,242,90,0.18)]`
- **Seçili Durum (Klonlanmış Özel Ses):** `border-purple-400 bg-purple-500/10 shadow-[0_0_0_1px_rgba(168,85,247,0.30)]`

### C. Özel Aralık Çubuğu (Audio Slider / Scrubber)
- İnce 4px yükseklik: `height: 4px; border-radius: 999px; background: rgba(255, 255, 255, 0.1);`
- Neon başparmak (Thumb): 14px yuvarlak, `background: #d8f25a; cursor: pointer;`

### D. Mikro Animasyonlar (Transitions & Micro-Motion)
- Sayfa ve panel geçişleri: `.animate-enter` (0.45s ease fade-in + `translateY(8px)`).
- Hover efektleri: `transition duration-200 ease-in-out`.
- Kayıt animasyonu: Canlı kırmızı halka nabzı (`animate-ping`).

---

## 📋 6. Stitch İstemleme Kuralları (Stitch Prompting Guidelines)

Bu projeye yeni bir arayüz veya bileşen tasarlatırken Stitch'e şu direktifler verilmelidir:
1. **Renk Kodlarını Asla Değiştirme:** Zemin daima `#08080a` ve `#111114`; vurgu daima `#d8f25a` (Accent) ve `#a855f7` (AI/Mor).
2. **Koyu Tema Dışına Çıkma:** Beyaz/açık gri arka plan kullanılmamalıdır.
3. **Font Ailesi:** Metinler için `Outfit`, saat/sayaçlar için `IBM Plex Mono`.
4. **Köşe Yuvarlama:** Kartlar için `rounded-3xl` ve `rounded-2xl`.
5. **İkonografi:** Daima `lucide-react` kütüphanesinden ince çizgi (1.5 - 2 stroke) ikonlar.
