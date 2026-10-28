import { Check, Cookie, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import { getCookieConsent, setCookieConsent, trackEvent } from '../lib/analytics'

export function CookieConsentBanner() {
  const { trEn } = useLanguage()
  const [consent, setConsentState] = useState(() => getCookieConsent())

  if (consent !== null) {
    return null
  }

  const handleAcceptAll = () => {
    setCookieConsent('accepted_all')
    setConsentState('accepted_all')
    trackEvent('cookie_consent_updated', { status: 'accepted_all' })
  }

  const handleEssentialOnly = () => {
    setCookieConsent('essential_only')
    setConsentState('essential_only')
  }

  return (
    <aside
      aria-label={trEn('Çerez Tercihleri', 'Cookie Preferences')}
      className="fixed bottom-16 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:right-5 sm:max-w-md z-40 rounded-3xl border border-chick-yellow/60 bg-[var(--card-bg)] p-5 shadow-2xl animate-enter"
    >
      <div className="flex items-start gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange">
          <Cookie className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-[var(--text-muted)] font-sans">
          <h3 className="text-sm font-bold text-[var(--text-main)] font-display flex items-center gap-1.5">
            <span>{trEn('Çerez ve Gizlilik Tercihleri', 'Cookie & Privacy Preferences')}</span>
            <ShieldCheck className="size-4 text-chick-success" aria-hidden="true" />
          </h3>
          <p>
            {trEn(
              'Ses stüdyosu tercihlerinizi (tema, dil, kayıt geçmişi) hatırlamak ve deneyiminizi iyileştirmek için yerel depolama ve analitik çerezleri kullanıyoruz. Detaylar için ',
              'We use local storage and analytics cookies to remember your studio preferences (theme, language, transcript history) and improve your experience. See our ',
            )}
            <Link
              to="/gizlilik-politikasi"
              className="font-bold text-chick-orange underline hover:text-[var(--text-main)]"
            >
              {trEn('Gizlilik Politikamızı', 'Privacy Policy')}
            </Link>
            {trEn(' inceleyebilirsiniz.', ' for details.')}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="inline-flex items-center gap-1.5 rounded-full bg-chick-yellow px-4 py-2 text-xs font-bold text-black shadow-xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Check className="size-3.5" aria-hidden="true" />
              <span>{trEn('Tümünü Kabul Et', 'Accept All')}</span>
            </button>
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-2 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <span>{trEn('Sadece Zorunlu', 'Essential Only')}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
