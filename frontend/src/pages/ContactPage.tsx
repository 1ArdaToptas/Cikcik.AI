import {
  AlertCircle,
  Clock,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLanguage } from '../context/LanguageContext'
import { trackEvent } from '../lib/analytics'

type FormErrors = {
  name?: string
  email?: string
  subject?: string
  message?: string
}

export function ContactPage() {
  const { trEn } = useLanguage()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (name.trim().length < 2) {
      next.name = trEn('Lütfen adınızı ve soyadınızı girin (en az 2 karakter).', 'Please enter your full name (at least 2 characters).')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      next.email = trEn('Lütfen geçerli bir e-posta adresi girin.', 'Please enter a valid email address.')
    }
    if (subject.trim().length < 3) {
      next.subject = trEn('Lütfen mesaj konusunu belirtin.', 'Please enter a subject.')
    }
    if (message.trim().length < 10) {
      next.message = trEn('Mesajınız en az 10 karakter olmalıdır.', 'Your message must be at least 10 characters.')
    }
    return next
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    trackEvent('contact_form_submitted', { subject: subject.trim() })

    window.setTimeout(() => {
      setIsSubmitting(false)
      void navigate(`/tesekkurler?name=${encodeURIComponent(name.trim())}`)
    }, 500)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-enter">
      {/* Header */}
      <section className="cambly-card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chick-orange">
          <MessageSquare className="size-4" aria-hidden="true" />
          <span>{trEn('7/24 Destek & İletişim', '24/7 Support & Contact')}</span>
        </div>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {trEn('İletişim Bilgileri ve Geri Bildirim', 'Contact Information & Feedback')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)] font-sans">
          {trEn(
            'Ses klonlama, 100K metin seslendirme veya Whisper transkripsiyon stüdyosu hakkında soru, öneri ve kurumsal iş birliği talepleriniz için bize ulaşın.',
            'Reach out to us for questions, suggestions, or enterprise inquiries regarding voice cloning, 100K TTS, or Whisper transcription studio.',
          )}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Contact Details Cards (#19 İletişim Bilgileri) */}
        <section className="space-y-4">
          <div className="cambly-card p-5 flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange">
              <Mail className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)] font-display">
                {trEn('E-Posta Adresi', 'Email Address')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {trEn('Teknik destek ve kurumsal talepler:', 'Technical support & inquiries:')}
              </p>
              <a
                href="mailto:destek@cicik.ai"
                className="mt-1 inline-block text-sm font-bold text-chick-orange hover:underline"
              >
                destek@cicik.ai
              </a>
            </div>
          </div>

          <div className="cambly-card p-5 flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange">
              <Phone className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)] font-display">
                {trEn('Telefon & WhatsApp Hattı', 'Phone & Support Line')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {trEn('Hafta içi 09:00 – 18:00 (GMT+3)', 'Weekdays 09:00 – 18:00 (GMT+3)')}
              </p>
              <a
                href="tel:+903523503838"
                className="mt-1 inline-block text-sm font-bold text-chick-orange hover:underline"
              >
                +90 (352) 350 38 38
              </a>
            </div>
          </div>

          <div className="cambly-card p-5 flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange">
              <MapPin className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)] font-display">
                {trEn('Stüdyo & Ofis Konumu', 'Studio & Office Location')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                {trEn(
                  'Erciyes Teknopark Tekno-3 Binası, Kat: 2, No: 204, Melikgazi / Kayseri',
                  'Erciyes Technopark Techno-3 Building, Floor 2, No: 204, Melikgazi, Kayseri / Turkey',
                )}
              </p>
            </div>
          </div>

          <div className="cambly-card p-5 flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange">
              <Clock className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)] font-display">
                {trEn('Ortalama Yanıt Süresi', 'Average Response Time')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {trEn('Mesajlarınıza ortalama 2 saat içinde dönüş yapıyoruz.', 'We respond to messages within 2 hours on average.')}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form with Inline Error Validation (#13 Form Hataları & #12 Loading Durumları) */}
        <section className="cambly-card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--text-main)] font-display">
            {trEn('Bize Mesaj Gönderin', 'Send Us a Message')}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {trEn('Tüm alanları doldurarak doğrudan ekibimize iletebilirsiniz.', 'Fill out the fields below to send a message directly to our team.')}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-bold text-[var(--text-main)]">
                {trEn('Adınız Soyadınız *', 'Full Name *')}
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder={trEn('Örn: Arda Yılmaz', 'e.g. Jane Doe')}
                aria-invalid={Boolean(errors.name)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--text-main)] bg-[var(--sidebar-bg)] outline-none transition ${
                  errors.name ? 'border-chick-red' : 'border-[var(--border-subtle)] focus:border-chick-yellow'
                }`}
              />
              {errors.name && (
                <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-chick-red">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-bold text-[var(--text-main)]">
                {trEn('E-Posta Adresiniz *', 'Email Address *')}
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                placeholder="ornek@eposta.com"
                aria-invalid={Boolean(errors.email)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--text-main)] bg-[var(--sidebar-bg)] outline-none transition ${
                  errors.email ? 'border-chick-red' : 'border-[var(--border-subtle)] focus:border-chick-yellow'
                }`}
              />
              {errors.email && (
                <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-chick-red">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-xs font-bold text-[var(--text-main)]">
                {trEn('Konu *', 'Subject *')}
              </label>
              <input
                id="contact-subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }))
                }}
                placeholder={trEn('Örn: Özel Ses Klonlama Desteği', 'e.g. Custom Voice Cloning Support')}
                aria-invalid={Boolean(errors.subject)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--text-main)] bg-[var(--sidebar-bg)] outline-none transition ${
                  errors.subject ? 'border-chick-red' : 'border-[var(--border-subtle)] focus:border-chick-yellow'
                }`}
              />
              {errors.subject && (
                <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-chick-red">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.subject}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-bold text-[var(--text-main)]">
                {trEn('Mesajınız *', 'Your Message *')}
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
                }}
                placeholder={trEn('Mesajınızı buraya yazın...', 'Write your message here...')}
                aria-invalid={Boolean(errors.message)}
                className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm text-[var(--text-main)] bg-[var(--sidebar-bg)] outline-none transition ${
                  errors.message ? 'border-chick-red' : 'border-[var(--border-subtle)] focus:border-chick-yellow'
                }`}
              />
              {errors.message && (
                <p role="alert" className="mt-1 flex items-center gap-1 text-xs font-semibold text-chick-red">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{errors.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-chick-yellow py-3 px-6 text-sm font-bold text-black shadow-sm transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin text-black" aria-hidden="true" />
                  <span>{trEn('Gönderiliyor…', 'Sending…')}</span>
                </>
              ) : (
                <>
                  <Send className="size-4 text-black" aria-hidden="true" />
                  <span>{trEn('Mesajı Gönder', 'Send Message')}</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
