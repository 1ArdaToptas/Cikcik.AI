import { CheckCircle2, Home, Mic, Sparkles, Volume2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { CicikMascot } from '../components/CicikMascot'
import { useLanguage } from '../context/LanguageContext'

export function ThankYouPage() {
  const { trEn } = useLanguage()
  const [searchParams] = useSearchParams()
  const senderName = searchParams.get('name')

  return (
    <section className="cambly-card mx-auto max-w-2xl p-8 sm:p-14 text-center space-y-6 animate-enter">
      <CicikMascot
        mood="success"
        size="lg"
        showSpeechBubble={true}
        customSpeech={trEn('Cik cik! Mesajını aldık!', 'Chirp! We got your message!')}
      />

      <div className="inline-flex items-center gap-2 rounded-full bg-chick-success/15 px-4 py-1.5 text-xs font-bold text-chick-success">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        <span>{trEn('İşlem Başarıyla Tamamlandı', 'Successfully Completed')}</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {senderName
            ? trEn(`Teşekkürler, ${senderName}!`, `Thank You, ${senderName}!`)
            : trEn('Teşekkür Ederiz!', 'Thank You!')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed font-sans">
          {trEn(
            'Mesajınız ve geri bildiriminiz Cicik AI ekibine başarıyla ulaştı. En kısa sürede inceleyip size geri dönüş yapacağız.',
            'Your message and feedback have reached the Cicik AI team. We will review it and get back to you shortly.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-6 py-3 text-sm font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Mic className="size-4" aria-hidden="true" />
          <span>{trEn('Canlı Stüdyoya Geç', 'Go to Live Studio')}</span>
        </Link>

        <Link
          to="/speech"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-3 text-sm font-bold text-[var(--text-main)] transition hover:border-chick-yellow"
        >
          <Volume2 className="size-4 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Metni Seslendir (TTS)', 'Text to Speech (TTS)')}</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-3 text-sm font-bold text-[var(--text-main)] transition hover:border-chick-yellow"
        >
          <Home className="size-4 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Ana Sayfa', 'Home')}</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-4 text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
        <Sparkles className="size-4 text-chick-orange shrink-0" aria-hidden="true" />
        <span>
          {trEn(
            'Destek referans numaranız yerel oturumunuzda kaydedildi.',
            'Your support reference has been saved in your local session.',
          )}
        </span>
      </div>
    </section>
  )
}
