import { FileCheck2, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'

export function TermsOfUsePage() {
  const { trEn } = useLanguage()

  return (
    <article className="cambly-card mx-auto max-w-4xl p-6 sm:p-10 space-y-6 animate-enter">
      <header className="border-b border-[var(--border-subtle)] pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chick-orange">
          <Scale className="size-4" aria-hidden="true" />
          <span>{trEn('Hizmet Sözleşmesi', 'Terms of Service')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {trEn('Kullanım Koşulları', 'Terms of Use')}
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)]">
          {trEn('Yürürlük Tarihi: 21 Ekim 2026', 'Effective Date: October 21, 2026')}
        </p>
      </header>

      <div className="space-y-5 text-sm sm:text-base leading-relaxed text-[var(--text-main)] font-sans">
        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('1. Hizmetin Kapsamı', '1. Scope of Service')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Cicik AI Studio; metinden sese (TTS), özel ses klonlama (XTTS v2) ve sesten metne transkripsiyon (Whisper STT) araçları sunan yapay zekâ destekli bir ses stüdyosudur.',
              'Cicik AI Studio is an AI-powered audio studio offering text-to-speech (TTS), custom voice cloning (XTTS v2), and speech-to-text transcription (Whisper STT).',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('2. Etik Ses Klonlama ve Telif Hakları', '2. Ethical Voice Cloning & Copyright')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Kullanıcılar, özel ses klonlama özelliğine yalnızca kendi seslerini veya açık rızasını aldıkları kişilerin ses kayıtlarını yüklemeyi kabul eder. Başka kişilerin seslerini izinsiz klonlamak, yanıltıcı içerik üretmek veya telif hakkı ihlali yapmak kesinlikle yasaktır.',
              'Users agree to upload only their own voice or voice recordings for which they have explicit consent when using custom voice cloning. Unauthorized voice cloning, impersonation, or copyright infringement is strictly prohibited.',
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-display text-chick-orange">
            {trEn('3. Adil Kullanım ve Sistem Limitleri', '3. Fair Use & System Limits')}
          </h2>
          <p className="text-[var(--text-muted)]">
            {trEn(
              'Tek seferde 100.000 karaktere kadar metin seslendirme ve 50 MB boyutuna kadar ses dosyası transkripsiyonu desteklenmektedir. Otomatik bot saldırıları veya servisi aşırı yüklemeye yönelik kötüye kullanımlar engellenir.',
              'Text-to-speech up to 100,000 characters and audio file transcription up to 50 MB are supported per request. Automated abuse or denial-of-service attempts are blocked.',
            )}
          </p>
        </section>
      </div>

      <footer className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <FileCheck2 className="size-4 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.', 'By using the platform, you agree to these terms.')}</span>
        </div>
        <Link
          to="/gizlilik-politikasi"
          className="rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-2 text-xs font-bold text-[var(--text-main)] hover:border-chick-yellow transition"
        >
          {trEn('Gizlilik Politikası', 'Privacy Policy')}
        </Link>
      </footer>
    </article>
  )
}
