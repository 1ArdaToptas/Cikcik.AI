import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { useLanguage } from '../../context/LanguageContext'
import { trackPageView } from '../../lib/analytics'
import { CookieConsentBanner } from '../CookieConsentBanner'
import { Footer } from './Footer'
import { MobileStickyCta } from './MobileStickyCta'
import { type ThemeMode, TopNavbar } from './TopNavbar'

type RouteMeta = { kicker: string; title: string; description: string }

const titlesTr: Record<string, RouteMeta> = {
  '/': {
    kicker: 'Akıllı Ses Platformu',
    title: 'Cicik AI Ana Sayfa · Nöral Ses & Transkripsiyon Stüdyosu',
    description:
      'Cicik AI ile 100.000 karakterlik Türkçe ve İngilizce nöral metin seslendirme, XTTS v2 ses klonlama ve Whisper STT transkripsiyon.',
  },
  '/studio': {
    kicker: 'Canlı Ses Yazıcı',
    title: 'Cicik Konuşma Stüdyosu · Canlı Mikrofon & Dosya Transkripsiyon',
    description:
      'Mikrofonunuza konuşun veya ses dosyası yükleyin; Whisper AI ve yapay zekâ önemli yerleri bozmadan metne döksün.',
  },
  '/transcripts': {
    kicker: 'Belgelerim',
    title: 'Transkript Kitaplığı · Okunaklı Notlar ve Özetler',
    description:
      'Kaydedilen konuşma transkriptlerinizi okunaklı paragraflar ve yapay zekâ önemli yerler görünümüyle yönetin.',
  },
  '/speech': {
    kicker: 'Metinden Sese (TTS)',
    title: 'Metni Seslendir & Ses Klonlama · 100K Nöral TTS',
    description:
      'Doğal Türkçe ve İngilizce yapay zekâ sesleriyle metinleri seslendirin veya XTTS v2 ile kendi sesinizi klonlayın.',
  },
  '/history': {
    kicker: 'Ses Arşivi',
    title: 'Ses & Üretim Geçmişi',
    description: 'Ürettiğiniz tüm ses dosyalarını ve transkript kayıtlarını tek ekrandan inceleyin.',
  },
  '/video-stt': {
    kicker: 'Video STT',
    title: 'Video Bağlantısından Metne Çevirici (YouTube & Ses STT)',
    description:
      'YouTube veya video bağlantılarını saniyeler içinde okunaklı metne ve önemli noktalara dönüştürün.',
  },
  '/iletisim': {
    kicker: 'Destek & İletişim',
    title: 'İletişim Bilgileri ve Geri Bildirim',
    description: 'Cicik AI ekibiyle iletişime geçin, teknik destek alın veya geri bildirim gönderin.',
  },
  '/tesekkurler': {
    kicker: 'Mesajınız Alındı',
    title: 'Teşekkür Ederiz',
    description: 'Mesajınız ve geri bildiriminiz Cicik AI ekibine başarıyla ulaştı.',
  },
  '/gizlilik-politikasi': {
    kicker: 'Veri Güvenliği',
    title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
    description: 'Cicik AI Studio yerel ses işleme, çerez kullanımı ve KVKK veri güvenliği ilkeleri.',
  },
  '/kullanim-kosullari': {
    kicker: 'Hizmet Sözleşmesi',
    title: 'Kullanım Koşulları',
    description: 'Cicik AI Studio hizmet kapsamı, etik ses klonlama kuralları ve kullanım koşulları.',
  },
}

const titlesEn: Record<string, RouteMeta> = {
  '/': {
    kicker: 'Smart Voice Platform',
    title: 'Cicik AI Home · Neural Voice & Transcription Studio',
    description:
      '100,000-character Turkish & English neural TTS, XTTS v2 voice cloning, and Whisper STT transcription.',
  },
  '/studio': {
    kicker: 'Live Voice Writer',
    title: 'Cicik Speech Studio · Live Mic & File Transcription',
    description:
      'Speak into your microphone or upload audio; Whisper AI transcribes and extracts key highlights.',
  },
  '/transcripts': {
    kicker: 'My Documents',
    title: 'Transcripts Library · Readable Notes & Highlights',
    description: 'Manage your saved speech transcripts with readable paragraphs and AI key highlights.',
  },
  '/speech': {
    kicker: 'Text to Speech (TTS)',
    title: 'Text to Speech & Voice Cloning · 100K Neural TTS',
    description:
      'Synthesize natural Turkish and English speech or clone your own voice with XTTS v2.',
  },
  '/history': {
    kicker: 'Audio Archive',
    title: 'Audio & Generation History',
    description: 'Browse and replay all your generated audio files and transcript recordings.',
  },
  '/video-stt': {
    kicker: 'Video STT',
    title: 'Video URL to Text Converter (YouTube & Audio STT)',
    description: 'Convert YouTube or video URLs into readable text and key highlights in seconds.',
  },
  '/iletisim': {
    kicker: 'Support & Contact',
    title: 'Contact Information & Feedback',
    description: 'Contact the Cicik AI team for technical support or feedback.',
  },
  '/tesekkurler': {
    kicker: 'Message Received',
    title: 'Thank You',
    description: 'Your message and feedback have reached the Cicik AI team.',
  },
  '/gizlilik-politikasi': {
    kicker: 'Data Protection',
    title: 'Privacy Policy',
    description: 'Cicik AI Studio local audio processing, cookie usage, and data privacy policy.',
  },
  '/kullanim-kosullari': {
    kicker: 'Terms of Service',
    title: 'Terms of Use',
    description: 'Cicik AI Studio scope of service, ethical voice cloning rules, and terms of use.',
  },
}

const fallbackTr: RouteMeta = {
  kicker: '404',
  title: 'Sayfa Bulunamadı (404)',
  description: 'Aradığınız sayfa bulunamadı. Cicik AI ana stüdyosuna dönebilirsiniz.',
}

const fallbackEn: RouteMeta = {
  kicker: '404',
  title: 'Page Not Found (404)',
  description: 'The page you are looking for could not be found.',
}

export function AppShell() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cicik_theme')
    if (saved === 'dark' || saved === 'sakura' || saved === 'light') {
      return saved
    }
    return 'light'
  })
  const location = useLocation()
  const { isEn, trEn } = useLanguage()
  const map = isEn ? titlesEn : titlesTr
  const meta = map[location.pathname] ?? (isEn ? fallbackEn : fallbackTr)

  useEffect(() => {
    const fullTitle = `${meta.title} · Cicik AI`
    document.title = fullTitle

    // Update <meta name="description"> dynamically per route (#3 Meta Description)
    const descEl = document.querySelector('meta[name="description"]')
    if (descEl) {
      descEl.setAttribute('content', meta.description)
    }

    // Track pageview (#18 Analytics)
    trackPageView(location.pathname, fullTitle)

    const root = document.documentElement
    root.classList.remove('dark', 'sakura')
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'sakura') {
      root.classList.add('sakura')
    }
    localStorage.setItem('cicik_theme', theme)
  }, [theme, location.pathname, meta.title, meta.description])

  return (
    <div className="flex min-h-svh flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-chick-yellow focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-black focus:shadow-lg"
      >
        {trEn('Ana içeriğe atla', 'Skip to main content')}
      </a>

      {/* Üstten Animasyonlu Modern Navbar */}
      <TopNavbar theme={theme} onSelectTheme={setTheme} />

      <main
        id="main-content"
        key={location.pathname}
        className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 max-w-7xl w-full mx-auto animate-enter"
      >
        <Outlet />
      </main>

      {/* Kurumsal Alt Bilgi, İletişim, Gizlilik ve Kullanım Koşulları (#15, #16, #19) */}
      <Footer />

      {/* Sabit Mobil CTA Bar (#11 Sabit mobil CTA) */}
      <MobileStickyCta />

      {/* Çerez Onay Banner'ı (#17 Çerez banner'ı) */}
      <CookieConsentBanner />
    </div>
  )
}
