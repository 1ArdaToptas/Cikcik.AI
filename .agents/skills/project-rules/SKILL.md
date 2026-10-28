---
name: project-rules
description: >-
  Enforces, audits, and guides the project's coding rules, architecture standards,
  performance constraints (CPU-only, memory limits, async handling), security guidelines,
  and frontend design conventions. Use this skill when the user asks about project rules,
  coding standards, guidelines, security practices, or code review requirements.
---

# Proje Kuralları ve Standartları Yeteneği (Project Rules Skill)

Bu yetenek, projedeki kod yazım kurallarını denetlemek, mimari ve güvenlik standartlarını korumak ve yeni kod eklenirken uyulması gereken yönergeleri uygulamak için kullanılır.

Detaylı daimi kurallar için ana dizindeki [`AGENTS.md`](file:///c:/Users/ardat/cursor%20project/tts-app/AGENTS.md) dosyasına başvurun.

---

## 📌 Zorunlu Geliştirme Kuralları (14 İlke)

1. **Python 3.11:** Tüm backend geliştirmelerinde Python 3.11 ve `backend\.venv` kullanılır.
2. **Ön Analiz:** Kod yazmadan önce mevcut proje yapısı incelenir.
3. **Mevcut Özellikleri Koruma:** Çalışan özellikler gereksiz değiştirilmez veya silinmez.
4. **Modülerlik:** Kodlar modüler ve okunabilir dosyalara ayrılır.
5. **Tek Sorumluluk:** Fonksiyonlar tek bir amaca hizmet eder (Single Responsibility).
6. **Bağımlılık Kontrolü:** Yeni dependency eklemeden önce mevcut paketler kontrol edilir.
7. **Hata & Loglama:** Kapsamlı hata yönetimi ve yapılandırılmış logging kullanılır.
8. **Doğru HTTP Kodları:** Endpoint'lerde semantik HTTP durum kodları döndürülür.
9. **Test Çalıştırma:** Değişikliklerden sonra `pytest` ve linter'lar çalıştırılır.
10. **Kök Neden Çözümü:** Hatalar yüzeysel kapatılmaz, kök nedeni bulunup çözülür.
11. **Büyük Değişiklik İletişimi:** Büyük refactor öncesi değişecek dosyalar listelenir.
12. **DRY:** Kod tekrarından kaçınılır.
13. **Güvenlik:** Enjeksiyon, path traversal ve kontrolsüz girdi açıklarına dikkat edilir.
14. **Hassas Bilgi Gizliliği:** API anahtarları, şifreler kaynak koda yazılmaz (`.env` kullanılır).

---

## 🛠️ Hızlı Kural Denetimi (Audit)

Geliştirme sonrasında projenin kurallara uyup uymadığını denetlemek için:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/project-rules/scripts/audit_rules.ps1
```
