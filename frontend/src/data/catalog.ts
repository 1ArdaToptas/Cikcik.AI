import type { Catalog } from '../types'

export const fallbackCatalog: Catalog = {
  voices: [
    {
      id: 'tr-ahmet',
      name: 'Ahmet (Akıcı & Doğal)',
      style: 'Haber, Anlatım & Profesyonel',
      tag: 'Çok Doğal',
      gender: 'Erkek',
      engine: 'edge',
      languages: ['tr-tr'],
    },
    {
      id: 'tr-emel',
      name: 'Emel (Sıcak & Net)',
      style: 'Samimi, Sesli Kitap & Sunum',
      tag: 'Çok Doğal',
      gender: 'Kadın',
      engine: 'edge',
      languages: ['tr-tr'],
    },
    {
      id: 'piper-tr',
      name: 'Piper Türkçe (Çevrimdışı)',
      style: 'Cihaz içi yerel nöral ses',
      tag: 'İnternetsiz',
      gender: 'Erkek',
      engine: 'piper',
      languages: ['tr-tr'],
    },
    {
      id: 'en-jenny',
      name: 'Jenny (Conversational)',
      style: 'Expressive & Friendly',
      tag: 'US Natural',
      gender: 'Kadın',
      engine: 'edge',
      languages: ['en-us'],
    },
    {
      id: 'en-guy',
      name: 'Guy (Professional)',
      style: 'Authoritative & Clear Narrator',
      tag: 'US Natural',
      gender: 'Erkek',
      engine: 'edge',
      languages: ['en-us'],
    },
    {
      id: 'en-aria',
      name: 'Aria (Dynamic & Studio)',
      style: 'Storytelling, Podcast & Demo',
      tag: 'Studio',
      gender: 'Kadın',
      engine: 'edge',
      languages: ['en-us'],
    },
    {
      id: 'en-brian',
      name: 'Brian (British Narrator)',
      style: 'Crisp British Accent & Documentaries',
      tag: 'UK Natural',
      gender: 'Erkek',
      engine: 'edge',
      languages: ['en-gb'],
    },
    {
      id: 'en-sonia',
      name: 'Sonia (British Studio)',
      style: 'Calm & Sophisticated British',
      tag: 'UK Natural',
      gender: 'Kadın',
      engine: 'edge',
      languages: ['en-gb'],
    },
  ],
  languages: [
    { id: 'tr-tr', label: 'Turkish', native: 'Türkçe' },
    { id: 'en-us', label: 'English (US)', native: 'English (US)' },
    { id: 'en-gb', label: 'English (UK)', native: 'English (UK)' },
  ],
  limits: { max_text_length: 100000, min_speed: 0.5, max_speed: 2 },
}

const accents = [
  'bg-gradient-to-br from-teal-600 to-emerald-700',
  'bg-gradient-to-br from-indigo-600 to-purple-700',
  'bg-gradient-to-br from-rose-600 to-pink-700',
  'bg-gradient-to-br from-amber-600 to-orange-700',
  'bg-gradient-to-br from-blue-600 to-cyan-700',
  'bg-gradient-to-br from-purple-600 to-fuchsia-800',
  'bg-gradient-to-br from-emerald-600 to-teal-800',
  'bg-gradient-to-br from-orange-600 to-red-700',
]

export function voiceAccent(voiceId: string) {
  let hash = 0
  for (const char of voiceId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return accents[hash % accents.length]
}
