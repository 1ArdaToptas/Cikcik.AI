import { Download, Pause, Play, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import { useStudio } from '../context/StudioContext'
import { formatClock } from '../lib/format'
import type { ActiveClip } from '../types'
import { RadixSlider } from './ui/RadixSlider'
import { Tooltip } from './ui/Tooltip'

type Props = {
  clip: ActiveClip | null
}

export function AudioPlayer({ clip }: Props) {
  const { voiceById, languageById } = useStudio()
  const { trEn } = useLanguage()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playError, setPlayError] = useState<string | null>(null)
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('tts_player_volume')
      return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 1
    } catch {
      return 1
    }
  })
  const [isMuted, setIsMuted] = useState(false)
  const prevVolumeRef = useRef(1)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
    try {
      localStorage.setItem('tts_player_volume', volume.toString())
    } catch {
      // Storage unavailable in private browsing mode
    }
  }, [volume, isMuted])

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      if (volume === 0) setVolume(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.8)
    } else {
      prevVolumeRef.current = volume > 0 ? volume : 0.8
      setIsMuted(true)
    }
  }

  const audioUrl = clip?.audioUrl

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!audioUrl) {
      audio.removeAttribute('src')
      audio.load()
      return
    }
    audio.src = audioUrl
    audio.load()
    audio.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'NotAllowedError') return
      if (error instanceof DOMException && error.name === 'AbortError') return
      setPlayError(trEn('Ses oynatılamadı.', 'Audio could not be played.'))
    })
  }, [audioUrl, trEn])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoadStart = () => {
      setCurrent(0)
      setPlayError(null)
      setPlaying(false)
      setDuration(0)
    }
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onPause)
    return () => {
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onPause)
    }
  }, [])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio || !clip) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    try {
      setPlayError(null)
      await audio.play()
    } catch {
      setPlayError(trEn('Ses oynatılamadı.', 'Audio could not be played.'))
    }
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(value)) return
    audio.currentTime = value
    setCurrent(value)
  }

  const download = () => {
    if (!clip) return
    const ext = clip.generation.audioFormat || 'mp3'
    const link = document.createElement('a')
    link.href = clip.audioUrl
    link.download = `${clip.generation.id}.${ext}`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const voice = clip ? voiceById(clip.generation.voiceId) : undefined
  const language = clip ? languageById(clip.generation.languageId) : undefined
  const total = duration > 0 ? duration : 0
  const engineBadge =
    voice?.engine === 'custom_clone'
      ? trEn('CikCik 1-e-1 Özel Klon', 'CikCik 1-to-1 Custom Clone')
      : voice?.engine === 'edge'
        ? trEn('CikCik Nöral Akıcı', 'CikCik Neural Fluent')
        : trEn('Yerel Piper Nöral', 'Local Piper Neural')

  return (
    <section
      className="cambly-card overflow-hidden transition-colors"
      aria-label={trEn('Cicik Ses Oynatıcı', 'Cicik Audio Player')}
    >
      <audio ref={audioRef} preload="metadata" />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src="/logo.jpg"
              alt={trEn('Cicik Ses Oynatıcı Maskotu', 'Cicik Audio Player Mascot')}
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className={`size-10 rounded-xl object-cover ring-2 ring-chick-yellow/60 shadow-md ${
                playing ? 'animate-chirp scale-105' : 'opacity-90'
              }`}
            />
            {playing && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-sky-500" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-chick-orange font-sans">
                {clip ? engineBadge : trEn('Cicik Canlı Oynatıcı', 'Cicik Live Player')}
              </p>
              {playing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-400/30">
                  <Volume2 className="size-3 animate-pulse" aria-hidden="true" />
                  {trEn('Oynatılıyor', 'Playing')}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm font-bold text-[var(--text-main)] font-display">
              {clip
                ? `${voice?.name ?? clip.generation.voiceId} · ${language?.native ?? clip.generation.languageId}`
                : trEn('Seslendirilen bir kayıt seçin', 'Select a generated audio clip')}
            </p>
          </div>
        </div>

        {clip ? (
          <div className="flex items-center gap-2 shrink-0">
            {playing && (
              <div className="hidden sm:flex items-end gap-1 h-5 mr-1" aria-hidden="true">
                <span className="w-1 rounded-full bg-sky-400 animate-wave-bar" style={{ animationDelay: '0ms' }} />
                <span className="w-1 rounded-full bg-chick-yellow animate-wave-bar" style={{ animationDelay: '150ms' }} />
                <span className="w-1 rounded-full bg-chick-orange animate-wave-bar" style={{ animationDelay: '300ms' }} />
                <span className="w-1 rounded-full bg-sky-400 animate-wave-bar" style={{ animationDelay: '75ms' }} />
              </div>
            )}
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-1 text-[11px] font-mono font-bold text-[var(--text-main)] uppercase">
              {clip.generation.audioFormat || 'wav'}
            </span>
            <span className="rounded-full border border-chick-yellow/40 bg-chick-yellow/20 px-2.5 py-1 text-[11px] font-mono font-bold text-[var(--text-main)]">
              {clip.generation.speed.toFixed(2)}×
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={!clip}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-chick-yellow text-black transition hover:scale-105 active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            aria-label={playing ? trEn('Duraklat', 'Pause') : trEn('Oynat', 'Play')}
          >
            {playing ? (
              <Pause className="size-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="size-4 fill-current ml-0.5" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <RadixSlider
              value={Math.min(current, total || 1)}
              onChange={seek}
              min={0}
              max={total || 1}
              step={0.01}
              disabled={!clip || total === 0}
              ariaLabel={trEn('Konum', 'Seek position')}
            />
            <div className="mt-1 flex justify-between font-mono text-[11px] font-semibold text-[var(--text-muted)]">
              <span>{formatClock(current)}</span>
              <span>{formatClock(total)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Tooltip content={isMuted || volume === 0 ? trEn('Sesi Aç', 'Unmute') : trEn('Sesi Kapat', 'Mute')}>
              <button
                type="button"
                onClick={toggleMute}
                disabled={!clip}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-main)] transition hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label={isMuted || volume === 0 ? trEn('Sesi Aç', 'Unmute') : trEn('Sesi Kapat', 'Mute')}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4 text-chick-red" aria-hidden="true" />
                ) : volume < 0.5 ? (
                  <Volume1 className="size-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="size-4" aria-hidden="true" />
                )}
              </button>
            </Tooltip>
            <div className="hidden sm:block w-20">
              <RadixSlider
                value={isMuted ? 0 : volume}
                onChange={(val) => {
                  setVolume(val)
                  if (val > 0 && isMuted) setIsMuted(false)
                }}
                min={0}
                max={1}
                step={0.05}
                disabled={!clip}
                ariaLabel={trEn('Ses seviyesi', 'Volume level')}
              />
            </div>
          </div>

          <Tooltip content={trEn('Sesi indir', 'Download audio')}>
            <button
              type="button"
              onClick={download}
              disabled={!clip}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-main)] transition hover:bg-chick-yellow hover:text-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label={trEn('Sesi indir', 'Download audio')}
            >
              <Download className="size-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
        {playError ? (
          <p className="mt-3 text-xs font-semibold text-chick-red" role="alert">
            {playError}
          </p>
        ) : null}
      </div>
    </section>
  )
}
