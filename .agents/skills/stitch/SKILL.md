---
name: stitch
description: >-
  Google Stitch design-to-code workflow skill. Use when the user wants to generate UI screens,
  convert Stitch mockups to React/Tailwind components, manage design systems, extract DESIGN.md
  tokens, enhance design prompts, or work with the Stitch MCP server.
---

# Google Stitch: Design-to-Code Yeteneği

Google Stitch, metin istemlerinden yüksek kaliteli web arayüzleri ve ekran tasarımları üretip bu tasarımları doğrudan üretim standartlarında React/TypeScript bileşenlerine dönüştüren bir yapay zekâ tasarım ekosistemidir.

Bu yetenek, `.agents/plugins/` altında kurulu olan 3 resmi Google Stitch paketini (`stitch-design`, `stitch-build`, `stitch-utilities`) koordine eder.

---

## 🧩 Yüklü Stitch Modülleri

| Modül / Plugin | İçerdiği Alt Yetenekler | Ne İşe Yarar? |
| :--- | :--- | :--- |
| **`stitch-design`** | `generate-design`, `code-to-design`, `manage-design-system`, `upload-to-stitch`, `extract-design-md` | İstemden sıfırdan ekran tasarımı üretir, tasarım sistemini (renk, tipografi, radius) yönetir. |
| **`stitch-build`** | `react-components`, `react-vite-dashboard`, `shadcn-ui`, `remotion`, `react-native` | Üretilen Stitch ekranlarını React (Vite + Tailwind) bileşenlerine dönüştürür. |
| **`stitch-utilities`** | `design-md`, `enhance-prompt`, `stitch-loop`, `taste-design`, `site-md` | Tasarım istemlerini UI/UX standartlarına göre güçlendirir ve `DESIGN.md` token dosyasını senkronize eder. |

---

## 🚀 Standart İş Akışı (Tasarım -> React Kodu)

### 1. İstem İyileştirme (Prompt Enhancement)
Basit bir kullanıcı isteğini (örn: *"modern bir ses oynatıcı tasarla"*), profesyonel UI/UX anahtar kelimeleriyle yapılandırın:
- Cam efekti (glassmorphism), renk paleti rolleri (surface, primary, accent), aralıklar ve responsive hiyerarşi.

### 2. Ekran Üretimi (`generate-design`)
Stitch MCP üzerinden ekran oluşturun veya var olan projeyi getirin:
- `stitch:list_projects`
- `stitch:create_project` / `stitch:generate_screen_from_text`
- `stitch:get_screen`

### 3. Tasarım Sistemini Çıkarma (`design-md`)
Tasarımın renk kodlarını ve tipografisini projenin `DESIGN.md` dosyasına çıkararak kaydetme:
- Tailwind renk token'ları, font aileleri, border radius değerleri.

### 4. React Bileşenine Dönüştürme (`react-components`)
İndirilen ekran kodunu ve görseli referans alarak:
1. `frontend/src/components/` altında modüler React bileşeni oluşturun.
2. Tasarım token'larını Tailwind CSS 4 sınıflarına dönüştürün.
3. TypeScript tip güvenliğini sağlayın (`props`, `state`, lucide ikonları).
4. `npm --prefix frontend run lint` ve `npm --prefix frontend run build` ile doğrulayın.

---

## 🛠️ Önkoşul ve Yapılandırma (Stitch MCP)

Stitch ile canlı API iletişimi kurmak için Stitch MCP sunucusu kullanılır:
- Dokümantasyon: [https://stitch.withgoogle.com/docs/mcp/setup/](https://stitch.withgoogle.com/docs/mcp/setup/)
- Proje `mcp_config.json` veya IDE ayarlarında `stitch` MCP sunucusu URL'i ve API anahtarı tanımlanır.
