import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { fallbackCatalog } from '../data/catalog'
import { loadAudio, pruneAudio, saveAudio } from '../lib/audioStore'
import { fetchCatalog, synthesizeSpeech, type SynthesisInput } from '../lib/ttsApi'
import type { ActiveClip, Catalog, Generation, Language, Voice } from '../types'

const STORAGE_KEY = 'resonant.generations.v3'
const LEGACY_STORAGE_KEY = 'resonant.generations.v2'
const HISTORY_LIMIT = 24

function isGeneration(value: unknown): value is Generation {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.text === 'string' &&
    typeof item.voiceId === 'string' &&
    typeof item.languageId === 'string' &&
    typeof item.speed === 'number' &&
    typeof item.createdAt === 'string' &&
    typeof item.duration === 'number'
  )
}

function loadGenerations(): Generation[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isGeneration).slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}

function persistGenerations(items: Generation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Quota exceeded / private mode
  }
}

type StudioContextValue = {
  catalog: Catalog
  catalogError: string | null
  generations: Generation[]
  activeClip: ActiveClip | null
  isGenerating: boolean
  errorMessage: string | null
  generate: (input: SynthesisInput) => Promise<void>
  playGeneration: (generation: Generation) => Promise<void>
  deleteGeneration: (id: string) => void
  clearHistory: () => void
  voiceById: (id: string) => Voice | undefined
  languageById: (id: string) => Language | undefined
  refreshCatalog: () => Promise<void>
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(fallbackCatalog)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [generations, setGenerations] = useState<Generation[]>(loadGenerations)
  const [activeClip, setActiveClip] = useState<ActiveClip | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const activeUrlRef = useRef<string | null>(null)
  const requestRef = useRef(0)

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await fetchCatalog()
      setCatalog(data)
      setCatalogError(null)
    } catch (error: unknown) {
      setCatalogError(error instanceof Error ? error.message : 'Ses kataloğu yüklenemedi.')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchCatalog(controller.signal)
      .then((data) => {
        setCatalog(data)
        setCatalogError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setCatalogError(error instanceof Error ? error.message : 'Ses kataloğu yüklenemedi.')
      })
    return () => controller.abort()
  }, [])

  useEffect(
    () => () => {
      if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current)
    },
    [],
  )

  const showClip = useCallback((generation: Generation, blob: Blob) => {
    const audioUrl = URL.createObjectURL(blob)
    if (activeUrlRef.current) URL.revokeObjectURL(activeUrlRef.current)
    activeUrlRef.current = audioUrl
    setActiveClip({ generation, audioUrl })
  }, [])

  const synthesize = useCallback(
    async (input: SynthesisInput) => {
      const requestId = ++requestRef.current
      setIsGenerating(true)
      setErrorMessage(null)
      try {
        const result = await synthesizeSpeech(input)
        return requestId === requestRef.current ? result : null
      } catch (error) {
        if (requestId === requestRef.current) {
          setErrorMessage(error instanceof Error ? error.message : 'Ses üretilemedi.')
        }
        return null
      } finally {
        if (requestId === requestRef.current) setIsGenerating(false)
      }
    },
    [],
  )

  const generate = useCallback(
    async (input: SynthesisInput) => {
      const text = input.text.trim()
      if (!text) return
      const result = await synthesize({ ...input, text })
      if (!result) return

      const generation: Generation = {
        id: result.id,
        text,
        voiceId: input.voiceId,
        languageId: input.languageId,
        speed: input.speed,
        createdAt: new Date().toISOString(),
        duration: result.duration,
        audioFormat: result.audioFormat,
      }

      await saveAudio(generation.id, result.blob)
      setGenerations((prev) => {
        const next = [generation, ...prev].slice(0, HISTORY_LIMIT)
        persistGenerations(next)
        void pruneAudio(new Set(next.map((item) => item.id)))
        return next
      })
      showClip(generation, result.blob)
    },
    [showClip, synthesize],
  )

  const playGeneration = useCallback(
    async (generation: Generation) => {
      setErrorMessage(null)
      const cached = await loadAudio(generation.id)
      if (cached) {
        showClip(generation, cached)
        return
      }
      const result = await synthesize(generation)
      if (!result) return
      await saveAudio(generation.id, result.blob)
      showClip({ ...generation, duration: result.duration, audioFormat: result.audioFormat }, result.blob)
    },
    [showClip, synthesize],
  )

  const deleteGeneration = useCallback((id: string) => {
    setGenerations((prev) => {
      const next = prev.filter((item) => item.id !== id)
      persistGenerations(next)
      void pruneAudio(new Set(next.map((item) => item.id)))
      return next
    })
    setActiveClip((current) => {
      if (current?.generation.id === id) {
        if (activeUrlRef.current) {
          URL.revokeObjectURL(activeUrlRef.current)
          activeUrlRef.current = null
        }
        return null
      }
      return current
    })
  }, [])

  const clearHistory = useCallback(() => {
    setGenerations([])
    persistGenerations([])
    void pruneAudio(new Set())
  }, [])

  const voiceById = useCallback(
    (id: string) => catalog.voices.find((voice) => voice.id === id),
    [catalog],
  )
  const languageById = useCallback(
    (id: string) => catalog.languages.find((language) => language.id === id),
    [catalog],
  )

  const value = useMemo(
    () => ({
      catalog,
      catalogError,
      generations,
      activeClip,
      isGenerating,
      errorMessage,
      generate,
      playGeneration,
      deleteGeneration,
      clearHistory,
      voiceById,
      languageById,
      refreshCatalog,
    }),
    [
      catalog,
      catalogError,
      generations,
      activeClip,
      isGenerating,
      errorMessage,
      generate,
      playGeneration,
      deleteGeneration,
      clearHistory,
      voiceById,
      languageById,
      refreshCatalog,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used within StudioProvider')
  return ctx
}
