import { ArrowLeft, Home, Mic, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CicikMascot } from '../components/CicikMascot'
import { useLanguage } from '../context/LanguageContext'

export function NotFoundPage() {
  const { trEn } = useLanguage()

  return (
    <section className="cambly-card mx-auto max-w-2xl p-8 sm:p-14 text-center space-y-6 animate-enter">
      <CicikMascot
        mood="error"
        size="lg"
        showSpeechBubble={true}
        customSpeech={trEn('Cik? Bu sayfa uçup gitmiş!', 'Chirp? This page flew away!')}
      />

      <div className="space-y-2">
        <span className="inline-block rounded-full bg-chick-yellow/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-chick-orange font-mono">
          404 · NOT FOUND
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {trEn('Aradığınız Sayfa Bulunamadı', 'Page Not Found')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto leading-relaxed font-sans">
          {trEn(
            'Ulaşmaya çalıştığınız bağlantı taşınmış, kaldırılmış veya yanlış yazılmış olabilir. Cicik sizi hemen ana stüdyoya götürebilir.',
            'The link you followed may have been moved, removed, or mistyped. Cicik can take you right back to the main studio.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-6 py-3 text-sm font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <Home className="size-4" aria-hidden="true" />
          <span>{trEn('Ana Sayfaya Dön', 'Back to Home')}</span>
        </Link>

        <Link
          to="/studio"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-3 text-sm font-bold text-[var(--text-main)] transition hover:border-chick-yellow"
        >
          <Mic className="size-4 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Canlı Stüdyo', 'Live Studio')}</span>
        </Link>

        <Link
          to="/speech"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-3 text-sm font-bold text-[var(--text-main)] transition hover:border-chick-yellow"
        >
          <Volume2 className="size-4 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Metni Seslendir', 'Text to Speech')}</span>
        </Link>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>{trEn('Önceki sayfaya geri git', 'Go back to previous page')}</span>
        </button>
      </div>
    </section>
  )
}
