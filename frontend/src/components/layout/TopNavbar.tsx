import {
  Check,
  ChevronDown,
  FileText,
  Flower2,
  Globe,
  History,
  Home,
  Mic,
  Moon,
  Radio,
  Sun,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { type Locale, useLanguage } from '../../context/LanguageContext'
import { CicikMascot } from '../CicikMascot'

export type ThemeMode = 'light' | 'dark' | 'sakura'

type Props = {
  theme: ThemeMode
  onSelectTheme: (mode: ThemeMode) => void
}

export function TopNavbar({ theme, onSelectTheme }: Props) {
  const { locale, setLocale, trEn } = useLanguage()
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const langMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isThemeMenuOpen && !isLangMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setIsLangMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsThemeMenuOpen(false)
        setIsLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isThemeMenuOpen, isLangMenuOpen])

  const navItems = [
    { to: '/', label: trEn('Ana Sayfa', 'Home'), icon: Home, end: true },
    { to: '/studio', label: trEn('Canlı Stüdyo', 'Live Studio'), icon: Mic, end: false },
    { to: '/transcripts', label: trEn('Transkriptler', 'Transcripts'), icon: FileText, end: false },
    { to: '/speech', label: trEn('Metinden Sese (TTS)', 'Text to Speech'), icon: Volume2, end: false },
    { to: '/history', label: trEn('Geçmiş', 'History'), icon: History, end: false },
  ]

  const langOptions: Array<{
    code: Locale
    short: string
    label: string
  }> = [
    { code: 'tr', short: 'TR', label: 'Türkçe (TR)' },
    { code: 'en', short: 'EN', label: 'English (EN)' },
  ]

  const themeOptions: Array<{
    mode: ThemeMode
    label: string
    icon: typeof Sun
    iconClass: string
  }> = [
    {
      mode: 'light',
      label: trEn('Gündüz', 'Light'),
      icon: Sun,
      iconClass: 'text-amber-500',
    },
    {
      mode: 'dark',
      label: trEn('Gece', 'Dark'),
      icon: Moon,
      iconClass: 'text-sky-400',
    },
    {
      mode: 'sakura',
      label: trEn('Sakura', 'Sakura'),
      icon: Flower2,
      iconClass: 'text-pink-500',
    },
  ]

  const activeThemeOption =
    themeOptions.find((t) => t.mode === theme) ?? themeOptions[0]
  const ActiveThemeIcon = activeThemeOption.icon

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 py-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink to="/" className="flex items-center gap-2.5 group rounded-2xl focus-visible:outline-2">
            <CicikMascot mood="idle" size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] font-display">
                  Cicik<span className="text-chick-orange">.</span>
                </span>
                <span className="rounded-full bg-chick-yellow px-2 py-0.5 text-[10px] font-bold text-black font-sans">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-tight hidden sm:block font-sans">
                {trEn('Sen konuş, Cicik yazsın', 'You speak, Cicik writes')}
              </span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Center Animated Navigation Tabs */}
        <nav
          className="hidden lg:flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1"
          aria-label={trEn('Ana menü', 'Main menu')}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-chick-yellow text-black font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-main)]'
                }`
              }
            >
              <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-105" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Status, Vertical Language Dropdown & Vertical Theme Dropdown */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live Whisper Status Badge */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <Radio className="size-3 text-emerald-600 dark:text-emerald-400 animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-bold text-[var(--text-main)]">
              {trEn('Whisper Canlı', 'Whisper Live')}
            </span>
          </div>

          {/* Vertical Language Dropdown Menu (Dil -> Türkçe / İngilizce) */}
          <div ref={langMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsLangMenuOpen((prev) => !prev)
                setIsThemeMenuOpen(false)
              }}
              aria-expanded={isLangMenuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 min-h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition-all hover:border-chick-yellow cursor-pointer shadow-xs"
              title={trEn('Dil Seçin', 'Select Language')}
            >
              <Globe className="size-4 shrink-0 text-chick-orange" aria-hidden="true" />
              <span>
                {trEn('Dil', 'Lang')} ({locale.toUpperCase()})
              </span>
              <ChevronDown
                className={`size-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                  isLangMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isLangMenuOpen && (
              <div
                role="menu"
                aria-label={trEn('Dil Seçenekleri', 'Language Options')}
                className="absolute right-0 top-full mt-2 w-40 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1.5 shadow-xl z-50 flex flex-col gap-1 animate-enter"
              >
                {langOptions.map((opt) => {
                  const isSelected = locale === opt.code
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setLocale(opt.code)
                        setIsLangMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-chick-yellow text-black shadow-xs'
                          : 'text-[var(--text-main)] hover:bg-[var(--sidebar-bg)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-grid size-5 place-items-center rounded-md bg-black/10 dark:bg-white/10 font-mono text-[10px] font-extrabold">
                          {opt.short}
                        </span>
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && <Check className="size-3.5 shrink-0 text-black" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Vertical Theme Dropdown Menu (Tema -> Gündüz / Gece / Sakura) */}
          <div ref={themeMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsThemeMenuOpen((prev) => !prev)
                setIsLangMenuOpen(false)
              }}
              aria-expanded={isThemeMenuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 min-h-9 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition-all hover:border-chick-yellow cursor-pointer shadow-xs"
              title={trEn('Tema Seçin', 'Select Theme')}
            >
              <ActiveThemeIcon
                className={`size-4 shrink-0 ${activeThemeOption.iconClass}`}
                aria-hidden="true"
              />
              <span>{trEn('Tema', 'Theme')}</span>
              <ChevronDown
                className={`size-3.5 text-[var(--text-muted)] transition-transform duration-200 ${
                  isThemeMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {isThemeMenuOpen && (
              <div
                role="menu"
                aria-label={trEn('Tema Seçenekleri', 'Theme Options')}
                className="absolute right-0 top-full mt-2 w-40 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-1.5 shadow-xl z-50 flex flex-col gap-1 animate-enter"
              >
                {themeOptions.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = theme === opt.mode
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => {
                        onSelectTheme(opt.mode)
                        setIsThemeMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-chick-yellow text-black shadow-xs'
                          : 'text-[var(--text-main)] hover:bg-[var(--sidebar-bg)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon
                          className={`size-4 shrink-0 ${isSelected ? 'text-black' : opt.iconClass}`}
                          aria-hidden="true"
                        />
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && <Check className="size-3.5 shrink-0 text-black" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Navigation Bar (<1024px) */}
      <nav
        className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--sidebar-bg)]/80 px-3 py-2 overflow-x-auto no-scrollbar"
        aria-label={trEn('Mobil ana menü', 'Mobile main menu')}
      >
        <div className="mx-auto flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-chick-yellow text-black font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--card-bg)]/60 border border-[var(--border-subtle)]'
                }`
              }
            >
              <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
