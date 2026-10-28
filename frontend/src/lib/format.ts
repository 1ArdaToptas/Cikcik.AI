export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  const mins = Math.floor(whole / 60)
  const secs = whole % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const relativeFormatterTr = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' })
const relativeFormatterEn = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeTime(iso: string, locale: 'tr' | 'en' = 'tr') {
  const delta = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(delta)) return ''
  const minutes = Math.round(delta / 60000)
  if (minutes < 1) return locale === 'en' ? 'just now' : 'az önce'
  const formatter = locale === 'en' ? relativeFormatterEn : relativeFormatterTr
  if (minutes < 60) return formatter.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return formatter.format(-hours, 'hour')
  return formatter.format(-Math.round(hours / 24), 'day')
}

export function truncate(text: string, max = 88) {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}
