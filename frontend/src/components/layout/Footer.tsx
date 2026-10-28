import { FileText, Globe, Mail, MapPin, Mic, Phone, Shield, Sparkles, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLanguage } from '../../context/LanguageContext'
import { CicikMascot } from '../CicikMascot'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  const { trEn } = useLanguage()

  return (
    <footer className="mt-12 border-t border-[var(--border-subtle)] bg-[var(--card-bg)] pb-20 sm:pb-10 pt-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <CicikMascot mood="idle" size="sm" />
              <div>
                <span className="text-lg font-bold text-[var(--text-main)] font-display">
                  Cicik<span className="text-chick-orange">.</span>AI
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {trEn('Nöral Ses & Transkripsiyon Stüdyosu', 'Neural Voice & Transcription Studio')}
                </p>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] font-sans">
              {trEn(
                '100.000 karakterlik Türkçe ve İngilizce nöral metin seslendirme, XTTS v2 ses klonlama ve yapay zekâ destekli Whisper sesten metne dönüştürme platformu.',
                '100,000-character Turkish & English neural text-to-speech, XTTS v2 voice cloning, and AI-powered Whisper speech-to-text platform.',
              )}
            </p>
          </div>

          {/* Col 2: Quick Studio Links */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-chick-orange font-sans">
              {trEn('Stüdyo Araçları', 'Studio Tools')}
            </h3>
            <ul className="space-y-2 text-xs font-medium text-[var(--text-muted)]">
              <li>
                <Link to="/studio" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Mic className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Canlı Ses Stüdyosu (STT)', 'Live Voice Studio (STT)')}</span>
                </Link>
              </li>
              <li>
                <Link to="/speech" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Volume2 className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Metinden Sese & Ses Klonlama', 'Text-to-Speech & Voice Cloning')}</span>
                </Link>
              </li>
              <li>
                <Link to="/video-stt" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Globe className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Video / YouTube Transkripsiyon', 'Video / YouTube Transcription')}</span>
                </Link>
              </li>
              <li>
                <Link to="/transcripts" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <FileText className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Transkript Kitaplığı', 'Transcripts Library')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Policies (#15 Privacy, #16 Terms, #7 Sitemap) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-chick-orange font-sans">
              {trEn('Yasal & Kurumsal', 'Legal & Policies')}
            </h3>
            <ul className="space-y-2 text-xs font-medium text-[var(--text-muted)]">
              <li>
                <Link to="/gizlilik-politikasi" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Shield className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Gizlilik Politikası ve KVKK', 'Privacy Policy')}</span>
                </Link>
              </li>
              <li>
                <Link to="/kullanim-kosullari" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Sparkles className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Kullanım Koşulları', 'Terms of Use')}</span>
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition">
                  <Mail className="size-3.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('İletişim & Geri Bildirim', 'Contact & Feedback')}</span>
                </Link>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[var(--text-main)] transition"
                >
                  <span>{trEn('Site Haritası (sitemap.xml)', 'Sitemap (sitemap.xml)')}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact Information (#19 İletişim Bilgileri) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-chick-orange font-sans">
              {trEn('İletişim Bilgileri', 'Contact Information')}
            </h3>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-chick-orange" aria-hidden="true" />
                <a href="mailto:destek@cicik.ai" className="hover:text-[var(--text-main)] transition">
                  destek@cicik.ai
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-chick-orange" aria-hidden="true" />
                <a href="tel:+903523503838" className="hover:text-[var(--text-main)] transition">
                  +90 (352) 350 38 38
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="size-3.5 shrink-0 text-chick-orange mt-0.5" aria-hidden="true" />
                <span>
                  {trEn(
                    'Erciyes Teknopark Tekno-3 Binası, Melikgazi / Kayseri',
                    'Erciyes Technopark Techno-3 Building, Kayseri / Turkey',
                  )}
                </span>
              </li>
            </ul>
            <div className="pt-1">
              <Link
                to="/iletisim"
                className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow bg-chick-yellow/15 px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] hover:bg-chick-yellow hover:text-black transition"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                <span>{trEn('Bize Yazın', 'Send a Message')}</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <p>
            © {CURRENT_YEAR} Cicik AI Studio. {trEn('Tüm hakları saklıdır.', 'All rights reserved.')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/gizlilik-politikasi" className="hover:text-[var(--text-main)] transition">
              {trEn('Gizlilik', 'Privacy')}
            </Link>
            <Link to="/kullanim-kosullari" className="hover:text-[var(--text-main)] transition">
              {trEn('Koşullar', 'Terms')}
            </Link>
            <Link to="/iletisim" className="hover:text-[var(--text-main)] transition">
              {trEn('İletişim', 'Contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
