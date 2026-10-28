import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'tr' | 'en'

const LOCALE_STORAGE_KEY = 'cicik_locale'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  isEn: boolean
  trEn: <T>(trValue: T, enValue: T) => T
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    return saved === 'en' ? 'en' : 'tr'
  })

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // ignore storage errors
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'tr' ? 'en' : 'tr'))
  }, [])

  const trEn = useCallback(
    <T,>(trValue: T, enValue: T): T => (locale === 'en' ? enValue : trValue),
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      isEn: locale === 'en',
      trEn,
    }),
    [locale, setLocale, toggleLocale, trEn],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
