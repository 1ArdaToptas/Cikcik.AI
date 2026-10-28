import { Lock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'

export function PrivacyPolicyPage() {
  const { trEn } = useLanguage()

  return (
    <article className="cambly-card mx-auto max-w-4xl p-6 sm:p-10 space-y-6 animate-enter">
      <header className="border-b border-[var(--border-subtle)] pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chick-orange">
          <ShieldCheck className="size-4" aria-hidden="true" />
          <span>{trEn('KVKK & Veri Güvenliği', 'Data Protection & Privacy')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {trEn('Gizlilik Politikası ve KVKK Aydınlatma Metni', 'Privacy Policy')}
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)]">
          {trEn('Son Güncelleme: 21 Ekim 2026', 'Last Updated: October 21, 2026')}
        </p>
      </header>

      <div className="space-y-5 text-sm sm:text-base leading-relaxed text-[var(--text-main)] font-sans">
        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('1. Veri İşleme ve Yerel Gizlilik İlkesi', '1. Data Processing & Local Privacy Principle')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Cicik AI Studio olarak ses kayıtlarınızın, klonlanan ses profillerinizin ve metin transkriptlerinizin gizliliğine en üst düzeyde önem veriyoruz. Whisper STT ve XTTS v2 ses işleme süreçleri doğrudan yerel/özel sunucu altyapısında çalıştırılır ve üçüncü taraf reklam ağlarıyla paylaşılmaz.',
              'At Cicik AI Studio, we prioritize the privacy of your voice recordings, cloned voice profiles, and text transcripts. Whisper STT and XTTS v2 audio processing run directly on local/private server infrastructure and are never shared with third-party ad networks.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('2. Toplanan Bilgiler ve Geçici Dosyalar', '2. Collected Information & Temporary Files')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Transkripsiyon için yüklenen ses dosyaları ve video bağlantılarından indirilen geçici ses akışları, işlem tamamlandıktan hemen sonra otomatik olarak temizlenir (finally blokları ile kalıcı olarak silinir). Kayıt geçmişiniz yalnızca kendi tarayıcınızın yerel depolama alanında (localStorage) tutulur.',
              'Audio files uploaded for transcription and temporary streams downloaded from video links are automatically purged immediately after processing. Your transcript history is stored exclusively in your browser’s localStorage.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('3. Çerezler (Cookies) ve Analitik', '3. Cookies & Analytics')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Uygulamamız dil seçiminizi (TR/EN), gece/gündüz tema tercihinizi ve çerez onayınızı saklamak için zorunlu yerel depolama anahtarları kullanır. İsteğe bağlı analitik çerezleri yalnızca açık onayınız ("Tümünü Kabul Et") halinde etkinleştirilir.',
              'Our application uses essential localStorage keys to remember your language (TR/EN), theme preference, and cookie consent. Optional analytics tracking is only enabled if you explicitly accept all cookies.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('4. Kullanıcı Hakları ve İletişim', '4. User Rights & Contact')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              '6698 sayılı KVKK ve GDPR kapsamında verilerinizin silinmesini talep etme, klonlanmış ses profillerinizi tek tıkla kaldırma ve geçmişinizi temizleme hakkına sahipsiniz. Sorularınız için bizimle iletişime geçebilirsiniz.',
              'Under KVKK and GDPR, you have the right to delete your data, remove cloned voice profiles with one click, and clear your history at any time. Contact us for any privacy inquiries.',
            )}
          </p>
        </section>
      </div>

      <footer className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Lock className="size-4 text-chick-success" aria-hidden="true" />
          <span>{trEn('Uçtan uca yerel ses güvenliği aktif.', 'End-to-end local voice security active.')}</span>
        </div>
        <Link
          to="/iletisim"
          className="rounded-full bg-chick-yellow px-5 py-2 text-xs font-bold text-black hover:scale-[1.02] transition"
        >
          {trEn('Veri & Gizlilik İletişim', 'Privacy Contact')}
        </Link>
      </footer>
    </article>
  )
}
