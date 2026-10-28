export const TRANSLATION_LANGUAGES = [
  { code: 'en', tr: 'İngilizce (EN)', en: 'English (EN)' },
  { code: 'tr', tr: 'Türkçe (TR)', en: 'Turkish (TR)' },
  { code: 'de', tr: 'Almanca (DE)', en: 'German (DE)' },
  { code: 'fr', tr: 'Fransızca (FR)', en: 'French (FR)' },
  { code: 'es', tr: 'İspanyolca (ES)', en: 'Spanish (ES)' },
  { code: 'ar', tr: 'Arapça (AR)', en: 'Arabic (AR)' },
  { code: 'ru', tr: 'Rusça (RU)', en: 'Russian (RU)' },
  { code: 'ja', tr: 'Japonca (JA)', en: 'Japanese (JA)' },
] as const

/**
 * Splits any transcript text into clean, readable paragraphs and sentences
 * without altering or removing its actual spoken content.
 */
export function splitIntoReadableParagraphs(rawText: string): string[] {
  const trimmed = rawText.trim()
  if (!trimmed) return []

  // If already split by blank lines, clean each paragraph
  const existingBlocks = trimmed
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (existingBlocks.length > 1) {
    return existingBlocks
  }

  // Otherwise split single block into sentences and group 2-3 sentences per paragraph
  const normalized = trimmed
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/([.,!?;:])([^\s\d.,!?;:])/g, '$1 $2')
    .replace(/\s+/g, ' ')

  const rawSentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  const sentences: string[] = []

  for (const part of rawSentences) {
    const words = part.split(/\s+/)
    if (words.length > 32) {
      for (let i = 0; i < words.length; i += 20) {
        const slice = words.slice(i, i + 20).join(' ')
        sentences.push(slice)
      }
    } else {
      sentences.push(part)
    }
  }

  const paragraphs: string[] = []
  let current: string[] = []
  let charCount = 0

  for (const s of sentences) {
    current.push(s)
    charCount += s.length
    if (current.length >= 3 || (current.length >= 2 && charCount >= 220)) {
      paragraphs.push(current.join(' '))
      current = []
      charCount = 0
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(' '))
  }

  return paragraphs
}

export function formatSecondsToTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatSegmentsToSrt(
  segments: Array<{ start: number; end: number; text: string }>,
): string {
  const formatSrtTime = (sec: number) => {
    const s = Math.max(0, sec)
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = Math.floor(s % 60)
    const ms = Math.floor((s % 1) * 1000)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  return segments
    .map((seg, index) => {
      return `${index + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}\n`
    })
    .join('\n')
}

export type SegmentGroup = {
  id: number
  start: number
  end: number
  text: string
  subSegments: Array<{ start: number; end: number; text: string }>
}

/**
 * Groups fine-grained transcript segments into clean, coherent chapters based on a duration
 * interval in seconds (default: 180s = 3 minutes).
 */
export function groupSegmentsByInterval(
  segments: Array<{ start: number; end: number; text: string }>,
  intervalSeconds: number = 180,
): SegmentGroup[] {
  if (!segments || segments.length === 0) return []

  if (intervalSeconds <= 0) {
    return segments.map((s, idx) => ({
      id: idx + 1,
      start: s.start,
      end: s.end,
      text: s.text.trim(),
      subSegments: [s],
    }))
  }

  const groups: SegmentGroup[] = []
  let currentGroup: SegmentGroup | null = null

  for (const seg of segments) {
    const text = seg.text.trim()
    if (!text) continue

    if (!currentGroup) {
      currentGroup = {
        id: 1,
        start: seg.start,
        end: seg.end,
        text,
        subSegments: [seg],
      }
      continue
    }

    const exceedsInterval = seg.start - currentGroup.start >= intervalSeconds

    if (exceedsInterval) {
      groups.push(currentGroup)
      currentGroup = {
        id: groups.length + 1,
        start: seg.start,
        end: seg.end,
        text,
        subSegments: [seg],
      }
    } else {
      currentGroup.end = Math.max(currentGroup.end, seg.end)
      currentGroup.text = `${currentGroup.text} ${text}`
      currentGroup.subSegments.push(seg)
    }
  }

  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups
}

export type SpeakerPalette = {
  id: string
  labelTr: string
  labelEn: string
  badgeClass: string
  cardBg: string
  borderAccent: string
  nameColor: string
  highlightClass: string
  dotClass: string
}

export const SPEAKER_PALETTES: SpeakerPalette[] = [
  {
    id: 'spk-1',
    labelTr: 'Konuşmacı 1',
    labelEn: 'Speaker 1',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    cardBg: 'bg-sky-500/[0.06] dark:bg-sky-500/10',
    borderAccent: 'border-l-4 border-l-sky-500 border-t-sky-500/20 border-r-sky-500/20 border-b-sky-500/20',
    nameColor: 'text-sky-600 dark:text-sky-400',
    highlightClass: 'bg-sky-500/20 text-sky-950 dark:text-sky-100 rounded px-1',
    dotClass: 'bg-sky-500 ring-sky-500/30',
  },
  {
    id: 'spk-2',
    labelTr: 'Konuşmacı 2',
    labelEn: 'Speaker 2',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    cardBg: 'bg-amber-500/[0.06] dark:bg-amber-500/10',
    borderAccent: 'border-l-4 border-l-amber-500 border-t-amber-500/20 border-r-amber-500/20 border-b-amber-500/20',
    nameColor: 'text-amber-600 dark:text-amber-400',
    highlightClass: 'bg-amber-500/20 text-amber-950 dark:text-amber-100 rounded px-1',
    dotClass: 'bg-amber-500 ring-amber-500/30',
  },
  {
    id: 'spk-3',
    labelTr: 'Konuşmacı 3',
    labelEn: 'Speaker 3',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    cardBg: 'bg-emerald-500/[0.06] dark:bg-emerald-500/10',
    borderAccent: 'border-l-4 border-l-emerald-500 border-t-emerald-500/20 border-r-emerald-500/20 border-b-emerald-500/20',
    nameColor: 'text-emerald-600 dark:text-emerald-400',
    highlightClass: 'bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 rounded px-1',
    dotClass: 'bg-emerald-500 ring-emerald-500/30',
  },
  {
    id: 'spk-4',
    labelTr: 'Konuşmacı 4',
    labelEn: 'Speaker 4',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    cardBg: 'bg-purple-500/[0.06] dark:bg-purple-500/10',
    borderAccent: 'border-l-4 border-l-purple-500 border-t-purple-500/20 border-r-purple-500/20 border-b-purple-500/20',
    nameColor: 'text-purple-600 dark:text-purple-400',
    highlightClass: 'bg-purple-500/20 text-purple-950 dark:text-purple-100 rounded px-1',
    dotClass: 'bg-purple-500 ring-purple-500/30',
  },
  {
    id: 'spk-5',
    labelTr: 'Konuşmacı 5',
    labelEn: 'Speaker 5',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    cardBg: 'bg-rose-500/[0.06] dark:bg-rose-500/10',
    borderAccent: 'border-l-4 border-l-rose-500 border-t-rose-500/20 border-r-rose-500/20 border-b-rose-500/20',
    nameColor: 'text-rose-600 dark:text-rose-400',
    highlightClass: 'bg-rose-500/20 text-rose-950 dark:text-rose-100 rounded px-1',
    dotClass: 'bg-rose-500 ring-rose-500/30',
  },
  {
    id: 'spk-6',
    labelTr: 'Konuşmacı 6',
    labelEn: 'Speaker 6',
    badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    cardBg: 'bg-indigo-500/[0.06] dark:bg-indigo-500/10',
    borderAccent: 'border-l-4 border-l-indigo-500 border-t-indigo-500/20 border-r-indigo-500/20 border-b-indigo-500/20',
    nameColor: 'text-indigo-600 dark:text-indigo-400',
    highlightClass: 'bg-indigo-500/20 text-indigo-950 dark:text-indigo-100 rounded px-1',
    dotClass: 'bg-indigo-500 ring-indigo-500/30',
  },
]

export type SpeakerTurn = {
  id: number
  speakerIndex: number // 0 to 5
  speakerName: string
  start: number
  end: number
  text: string
  sentenceCount: number
  role?: string
  palette: (typeof SPEAKER_PALETTES)[number]
}

/**
 * Intelligent Multi-Speaker Diarization & Segmentation:
 * Segregates dialogues into colored speaker turns based on speaker count (2, 3, 4+),
 * explicit names/tags, question turns, and conversational pauses.
 */
export function diarizeTranscript(
  segments: Array<{ start: number; end: number; text: string; speaker?: string }>,
  rawText: string,
  speakerCount: number = 2,
): SpeakerTurn[] {
  const sourceItems: Array<{
    start: number
    end: number
    rawText: string
    explicitSpeaker?: string
  }> = []

  if (segments && segments.length > 0) {
    for (const seg of segments) {
      const clean = seg.text.trim()
      if (!clean) continue
      sourceItems.push({
        start: seg.start,
        end: seg.end,
        rawText: clean,
        explicitSpeaker: seg.speaker,
      })
    }
  } else {
    const paras = splitIntoReadableParagraphs(rawText)
    let curTime = 0
    for (const p of paras) {
      const duration = Math.max(4, Math.round(p.split(/\s+/).length * 0.4))
      sourceItems.push({
        start: curTime,
        end: curTime + duration,
        rawText: p,
      })
      curTime += duration
    }
  }

  if (sourceItems.length === 0) return []

  // Check for explicit speaker labels: e.g. "Ahmet:", "[Konuşmacı 1]", "Speaker A:"
  const explicitSpeakerMap = new Map<string, number>()
  const parsedItems: Array<{
    start: number
    end: number
    text: string
    speakerIndex: number | null
    isTurnMarker: boolean
  }> = []

  const speakerPrefixRegex = /^(?:>>\s*)?(?:\[([^\]]+)\]|([A-Za-zÇĞİÖŞÜçğıöşü\d\s]{2,20}):)\s*(.*)$/

  for (const item of sourceItems) {
    let text = item.rawText
    let isTurnMarker = text.startsWith('>>') || item.explicitSpeaker === 'turn_change'
    if (text.startsWith('>>')) {
      text = text.replace(/^>>\s*/, '').trim()
    }

    const match = text.match(speakerPrefixRegex)
    let speakerIndex: number | null = null

    if (match) {
      const detectedName = (match[1] || match[2] || '').trim()
      if (detectedName) {
        if (!explicitSpeakerMap.has(detectedName)) {
          explicitSpeakerMap.set(detectedName, explicitSpeakerMap.size % SPEAKER_PALETTES.length)
        }
        speakerIndex = explicitSpeakerMap.get(detectedName)!
        text = match[3].trim()
        isTurnMarker = true
      }
    }

    parsedItems.push({
      start: item.start,
      end: item.end,
      text: text || item.rawText,
      speakerIndex,
      isTurnMarker,
    })
  }

  const effectiveSpeakerCount = Math.max(
    2,
    speakerCount > 0 ? speakerCount : Math.max(2, explicitSpeakerMap.size),
  )

  const turns: SpeakerTurn[] = []
  let currentSpeaker = 0
  let currentTurn: SpeakerTurn | null = null

  for (let i = 0; i < parsedItems.length; i++) {
    const item = parsedItems[i]
    const prevItem = i > 0 ? parsedItems[i - 1] : null

    let shouldShift = false

    if (item.speakerIndex !== null) {
      if (currentTurn && item.speakerIndex !== currentTurn.speakerIndex) {
        shouldShift = true
        currentSpeaker = item.speakerIndex
      } else {
        currentSpeaker = item.speakerIndex
      }
    } else if (item.isTurnMarker) {
      shouldShift = true
      currentSpeaker = (currentSpeaker + 1) % effectiveSpeakerCount
    } else if (prevItem) {
      const pauseDuration = item.start - prevItem.end
      const prevEndedWithQuestion = /[?？]\s*$/.test(prevItem.text)
      const currentHasSubstantialLength = currentTurn && currentTurn.text.split(/\s+/).length >= 24

      if (pauseDuration >= 1.4 || prevEndedWithQuestion || currentHasSubstantialLength) {
        shouldShift = true
        currentSpeaker = (currentSpeaker + 1) % effectiveSpeakerCount
      }
    }

    const speakerConfig = SPEAKER_PALETTES[currentSpeaker % SPEAKER_PALETTES.length]
    const speakerLabel = speakerConfig.labelTr

    if (!currentTurn || shouldShift) {
      if (currentTurn) {
        turns.push(currentTurn)
      }
      currentTurn = {
        id: turns.length + 1,
        speakerIndex: currentSpeaker,
        speakerName: speakerLabel,
        start: item.start,
        end: item.end,
        text: item.text,
        sentenceCount: 1,
        palette: speakerConfig,
      }
    } else {
      currentTurn.end = Math.max(currentTurn.end, item.end)
      currentTurn.text = `${currentTurn.text} ${item.text}`
      currentTurn.sentenceCount += 1
    }
  }

  if (currentTurn) {
    turns.push(currentTurn)
  }

  return turns
}
