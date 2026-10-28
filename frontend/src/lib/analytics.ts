const CONSENT_KEY = 'cicik_cookie_consent_v1'
const ANALYTICS_EVENTS_KEY = 'cicik_analytics_events_v1'

export type CookieConsentStatus = 'accepted_all' | 'essential_only' | null

export type AnalyticsEvent = {
  name: string
  path: string
  timestamp: string
  meta?: Record<string, string | number | boolean>
}

export function getCookieConsent(): CookieConsentStatus {
  try {
    const val = localStorage.getItem(CONSENT_KEY)
    if (val === 'accepted_all' || val === 'essential_only') return val
    return null
  } catch {
    return null
  }
}

export function setCookieConsent(status: 'accepted_all' | 'essential_only'): void {
  try {
    localStorage.setItem(CONSENT_KEY, status)
  } catch {
    // ignore storage errors
  }
}

export function trackPageView(path: string, title: string): void {
  trackEvent('page_view', { path, title })
}

export function trackEvent(
  name: string,
  meta?: Record<string, string | number | boolean>,
): void {
  const consent = getCookieConsent()
  // Respect user privacy if they explicitly chose essential_only
  if (consent === 'essential_only') return

  const payload: AnalyticsEvent = {
    name,
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    timestamp: new Date().toISOString(),
    meta,
  }

  try {
    // Forward to Google Tag Manager / GA4 dataLayer if present
    const win = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>
    }
    if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: name, ...meta, page_path: payload.path })
    }

    // Store lightweight local analytics log (capped at 50 events)
    const raw = localStorage.getItem(ANALYTICS_EVENTS_KEY)
    const prev: AnalyticsEvent[] = raw ? JSON.parse(raw) : []
    const next = [payload, ...prev].slice(0, 50)
    localStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}
