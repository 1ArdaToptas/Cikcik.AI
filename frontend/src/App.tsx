import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

import { AppShell } from './components/layout/AppShell'
import { TooltipProvider } from './components/ui/Tooltip'
import { LanguageProvider } from './context/LanguageContext'
import { StudioProvider } from './context/StudioContext'

// Lazy-loaded route pages for optimal bundle splitting
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const CicikStudio = lazy(() => import('./pages/CicikStudio').then((m) => ({ default: m.CicikStudio })))
const TranscriptsPage = lazy(() => import('./pages/TranscriptsPage').then((m) => ({ default: m.TranscriptsPage })))
const TextToSpeech = lazy(() => import('./pages/TextToSpeech').then((m) => ({ default: m.TextToSpeech })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const SpeechToText = lazy(() => import('./pages/SpeechToText').then((m) => ({ default: m.SpeechToText })))
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })))
const ThankYouPage = lazy(() => import('./pages/ThankYouPage').then((m) => ({ default: m.ThankYouPage })))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage').then((m) => ({ default: m.TermsOfUsePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-live="polite">
      <LoaderCircle className="size-8 animate-spin text-chick-orange" aria-hidden="true" />
    </div>
  )
}

export default function App() {
  return (
    <TooltipProvider>
      <LanguageProvider>
        <StudioProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<AppShell />}>
                  {/* 1. Brand Home / Landing Dashboard */}
                  <Route path="/" element={<HomePage />} />

                  {/* 2. Live Recording & Transcription Studio */}
                  <Route path="/studio" element={<CicikStudio />} />

                  {/* 3. Dedicated Transcripts Library & Reader */}
                  <Route path="/transcripts" element={<TranscriptsPage />} />

                  {/* 4. Text to Speech (100k neural & voice cloning) */}
                  <Route path="/speech" element={<TextToSpeech />} />

                  {/* 5. Dedicated History Archive (Audio generations & recordings) */}
                  <Route path="/history" element={<HistoryPage />} />

                  {/* Preserved URL Video STT route */}
                  <Route path="/video-stt" element={<SpeechToText />} />

                  {/* Legal, Contact & Thank You Pages */}
                  <Route path="/iletisim" element={<ContactPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/tesekkurler" element={<ThankYouPage />} />
                  <Route path="/thank-you" element={<ThankYouPage />} />
                  <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/kullanim-kosullari" element={<TermsOfUsePage />} />
                  <Route path="/terms" element={<TermsOfUsePage />} />

                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </StudioProvider>
      </LanguageProvider>
    </TooltipProvider>
  )
}
