import { Mic, Volume2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useLanguage } from '../../context/LanguageContext'

export function MobileStickyCta() {
  const { trEn } = useLanguage()

  return (
    <div
      role="region"
      aria-label={trEn('Hızlı Mobil İşlemler', 'Quick Mobile Actions')}
      className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--card-bg)]/95 backdrop-blur-md px-3 py-2.5 shadow-lg"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
        <NavLink
          to="/studio"
          className={({ isActive }) =>
            `inline-flex items-center justify-center gap-2 rounded-full py-2.5 px-3 text-xs font-bold transition ${
              isActive
                ? 'bg-chick-yellow text-black shadow-xs'
                : 'bg-chick-yellow/90 text-black hover:bg-chick-yellow'
            }`
          }
        >
          <Mic className="size-4 shrink-0" aria-hidden="true" />
          <span>{trEn('Canlı Kayıt (STT)', 'Live Record (STT)')}</span>
        </NavLink>

        <NavLink
          to="/speech"
          className={({ isActive }) =>
            `inline-flex items-center justify-center gap-2 rounded-full border py-2.5 px-3 text-xs font-bold transition ${
              isActive
                ? 'border-chick-orange bg-chick-orange/15 text-[var(--text-main)]'
                : 'border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-main)]'
            }`
          }
        >
          <Volume2 className="size-4 shrink-0 text-chick-orange" aria-hidden="true" />
          <span>{trEn('Metni Seslendir', 'Text to Speech')}</span>
        </NavLink>
      </div>
    </div>
  )
}
