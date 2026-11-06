'use client'

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import type { Product } from '@/lib/types'
import { normalizeMediaUrl } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

export type PlayerTrack = {
  id: string
  productId?: string
  fileName?: string
  slug: string
  title: string
  artist: string
  description: string
  thumbnailUrl: string
  wavUrl: string | null
  mp3Url: string | null
  previewUrl: string | null
  acapellaUrl: string | null
  instrumentalUrl: string | null
  videoUrl: string | null
  isUnlocked: boolean
  priceCents: number
}

export type StemMode = 'master' | 'mp3' | 'acapella' | 'instrumental'
export type LoopMode = 'all' | 'one'
export type PlayerViewMode = 'pill' | 'bar' | 'widget'

const QUEUE_ORDER_STORAGE_KEY = 'sleepy_player_queue_order_v1'

type GlobalPlayerContextValue = {
  tracks: PlayerTrack[]
  activeTrack: PlayerTrack | null
  stemMode: StemMode
  loopMode: LoopMode
  isPlaying: boolean
  currentTime: number
  duration: number
  isMuted: boolean
  volume: number
  isMinimized: boolean
  playerViewMode: PlayerViewMode
  isPiPActive: boolean
  pipWindow: Window | null
  pipContainer: HTMLElement | null
  setQueue: (newTracks: PlayerTrack[], initialTrackId?: string | null) => void
  selectAndPlayTrack: (
    track: PlayerTrack,
    newStem?: StemMode,
    queueIfMissing?: PlayerTrack[]
  ) => void
  moveTrackInQueue: (fromIndex: number, toIndex: number) => void
  moveTrackById: (trackId: string, direction: -1 | 1) => void
  playNextInQueue: (track: PlayerTrack) => void
  addToQueue: (track: PlayerTrack) => void
  removeFromQueue: (trackId: string) => void
  shuffleQueue: () => void
  toggleLoopMode: () => void
  togglePlay: () => void
  pause: () => void
  seek: (time: number) => void
  stepTrack: (direction: -1 | 1) => void
  toggleMute: () => void
  setVolume: (val: number) => void
  setIsMinimized: (val: boolean) => void
  setPlayerViewMode: (mode: PlayerViewMode) => void
  openExpandedWidget: () => void
  collapseFromWidget: () => void
  togglePiP: () => Promise<void>
  closePlayer: () => void
}

const GlobalPlayerContext = createContext<GlobalPlayerContextValue | null>(null)

export function useGlobalPlayer(): GlobalPlayerContextValue {
  const ctx = useContext(GlobalPlayerContext)
  if (!ctx) {
    throw new Error('useGlobalPlayer must be used within a GlobalPlayerProvider')
  }
  return ctx
}

/**
 * Converts a Product into one or more PlayerTrack items (handling both singles and multi-track albums).
 */
export function productToPlayerTracks(
  prod: Product,
  isUnlocked = false
): PlayerTrack[] {
  const folderStats = prod.folder_stats
  const wavFiles = (folderStats?.files || []).filter(
    (f) =>
      f.extension === '.wav' &&
      !f.name.toLowerCase().includes('acapella') &&
      !f.name.toLowerCase().includes('instrumental')
  )
  const mp3Files = (folderStats?.files || []).filter(
    (f) => f.extension === '.mp3'
  )
  const coverFiles = (folderStats?.files || []).filter((f) =>
    ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(f.extension)
  )

  const thumbnailUrl =
    normalizeMediaUrl(prod.thumbnail_url) ||
    coverFiles[0]?.publicUrl ||
    '/images/logos/PNG-04.png'

  if (wavFiles.length > 1 || mp3Files.length > 1) {
    const primaryList = wavFiles.length > 1 ? wavFiles : mp3Files
    return primaryList.map((file, idx) => {
      const trackKey = `${prod.id}::${file.name}`
      const matchingMp3 =
        mp3Files[idx]?.publicUrl ||
        normalizeMediaUrl(prod.mp3_url) ||
        normalizeMediaUrl(prod.audio_preview_url) ||
        null
      const fileUrl =
        file.publicUrl ||
        normalizeMediaUrl(prod.wav_url) ||
        normalizeMediaUrl(prod.mp3_url) ||
        null

      return {
        id: trackKey,
        productId: prod.id,
        fileName: file.name,
        slug: prod.slug || prod.id,
        title: `${prod.name} — ${idx + 1}. ${file.title || file.name}`,
        artist: 'sleepyred999',
        description:
          prod.description || `Pista #${idx + 1} del álbum ${prod.name}`,
        thumbnailUrl,
        wavUrl: file.extension === '.wav' ? fileUrl : normalizeMediaUrl(prod.wav_url) || null,
        mp3Url: matchingMp3 || fileUrl,
        previewUrl: matchingMp3 || fileUrl,
        acapellaUrl: normalizeMediaUrl(prod.acapella_url) || null,
        instrumentalUrl: normalizeMediaUrl(prod.instrumental_url) || null,
        videoUrl: prod.video_url || null,
        isUnlocked,
        priceCents: prod.price_cents || 0,
      }
    })
  }

  const singleWav =
    normalizeMediaUrl(prod.wav_url) || wavFiles[0]?.publicUrl || null
  const singleMp3 =
    normalizeMediaUrl(prod.mp3_url) || mp3Files[0]?.publicUrl || null
  const singlePreview =
    normalizeMediaUrl(prod.audio_preview_url) ||
    singleMp3 ||
    singleWav ||
    null

  return [
    {
      id: prod.id,
      productId: prod.id,
      slug: prod.slug || prod.id,
      title: prod.name,
      artist: 'sleepyred999',
      description: prod.description || 'Máster Digital Oficial',
      thumbnailUrl,
      wavUrl: singleWav,
      mp3Url: singleMp3 || singlePreview,
      previewUrl: singlePreview,
      acapellaUrl: normalizeMediaUrl(prod.acapella_url) || null,
      instrumentalUrl: normalizeMediaUrl(prod.instrumental_url) || null,
      videoUrl: prod.video_url || null,
      isUnlocked,
      priceCents: prod.price_cents || 0,
    },
  ]
}

export function resolveTrackAudioSource(
  track: PlayerTrack | null,
  mode: StemMode
): string {
  if (!track) return ''
  let raw = ''
  switch (mode) {
    case 'acapella':
      raw =
        track.acapellaUrl ||
        track.wavUrl ||
        track.mp3Url ||
        track.previewUrl ||
        ''
      break
    case 'instrumental':
      raw =
        track.instrumentalUrl ||
        track.wavUrl ||
        track.mp3Url ||
        track.previewUrl ||
        ''
      break
    case 'mp3':
      raw = track.mp3Url || track.previewUrl || track.wavUrl || ''
      break
    case 'master':
    default:
      raw = track.wavUrl || track.mp3Url || track.previewUrl || ''
      break
  }
  return normalizeMediaUrl(raw) || raw
}

export function GlobalPlayerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [tracks, setTracks] = useState<PlayerTrack[]>([])
  const [activeTrack, setActiveTrack] = useState<PlayerTrack | null>(null)
  const [stemMode, setStemMode] = useState<StemMode>('master')
  const [loopMode, setLoopMode] = useState<LoopMode>('all')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const [playerViewMode, setPlayerViewModeState] =
    useState<PlayerViewMode>('bar')
  const lastCompactModeRef = useRef<'pill' | 'bar'>('bar')
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null)

  const isMinimized = playerViewMode === 'pill'

  const runWithViewTransition = useCallback((fn: () => void) => {
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (
        document as Document & {
          startViewTransition?: (cb: () => void) => { finished: Promise<void> }
        }
      ).startViewTransition === 'function'
    ) {
      try {
        ;(
          document as Document & {
            startViewTransition: (cb: () => void) => { finished: Promise<void> }
          }
        ).startViewTransition(() => {
          fn()
        })
        return
      } catch {
        // Fallback to direct update
      }
    }
    fn()
  }, [])

  const setPlayerViewMode = useCallback(
    (mode: PlayerViewMode) => {
      if (mode === 'pill' || mode === 'bar') {
        lastCompactModeRef.current = mode
      }
      runWithViewTransition(() => {
        setPlayerViewModeState(mode)
      })
    },
    [runWithViewTransition]
  )

  const setIsMinimized = useCallback(
    (val: boolean) => {
      const target: PlayerViewMode = val ? 'pill' : 'bar'
      lastCompactModeRef.current = target
      runWithViewTransition(() => {
        setPlayerViewModeState(target)
      })
    },
    [runWithViewTransition]
  )

  const openExpandedWidget = useCallback(() => {
    runWithViewTransition(() => {
      setPlayerViewModeState((curr) => {
        if (curr === 'pill' || curr === 'bar') {
          lastCompactModeRef.current = curr
        }
        return 'widget'
      })
    })
  }, [runWithViewTransition])

  const collapseFromWidget = useCallback(() => {
    const target = lastCompactModeRef.current || 'bar'
    runWithViewTransition(() => {
      setPlayerViewModeState(target)
    })
  }, [runWithViewTransition])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pipVideoRef = useRef<HTMLVideoElement | null>(null)
  const coverImageRef = useRef<HTMLImageElement | null>(null)
  const loadedSrcRef = useRef<string>('')
  const playRequestIdRef = useRef<number>(0)

  const activeTrackRef = useRef<PlayerTrack | null>(null)
  const tracksRef = useRef<PlayerTrack[]>([])
  const stemModeRef = useRef<StemMode>('master')
  const loopModeRef = useRef<LoopMode>('all')
  const isPlayingRef = useRef<boolean>(false)
  const isAdminUserRef = useRef<boolean>(false)
  const unlockedKeysRef = useRef<Set<string>>(new Set())
  const productPricesRef = useRef<Map<string, number>>(new Map())

  const persistQueueOrder = useCallback((list: PlayerTrack[]) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          QUEUE_ORDER_STORAGE_KEY,
          JSON.stringify(list.map((t) => t.id))
        )
      }
    } catch {}
  }, [])

  const applySavedQueueOrder = useCallback((list: PlayerTrack[]): PlayerTrack[] => {
    try {
      if (typeof window === 'undefined') return list
      const raw = window.localStorage.getItem(QUEUE_ORDER_STORAGE_KEY)
      if (!raw) return list
      const savedIds = JSON.parse(raw) as string[]
      if (!Array.isArray(savedIds) || savedIds.length === 0) return list
      const orderMap = new Map<string, number>()
      savedIds.forEach((id, idx) => orderMap.set(id, idx))
      return [...list].sort((a, b) => {
        const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : 9999
        const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : 9999
        return ia - ib
      })
    } catch {
      return list
    }
  }, [])

  const enrichTrackUnlockStatus = useCallback((t: PlayerTrack): PlayerTrack => {
    const pid = t.productId || t.id
    const isUnlocked =
      t.isUnlocked ||
      isAdminUserRef.current ||
      unlockedKeysRef.current.has(t.id) ||
      unlockedKeysRef.current.has(pid) ||
      (Boolean(t.slug) && unlockedKeysRef.current.has(t.slug))

    if (isUnlocked) {
      unlockedKeysRef.current.add(t.id)
      if (t.productId) unlockedKeysRef.current.add(t.productId)
      if (t.slug) unlockedKeysRef.current.add(t.slug)
    }

    const fallbackAudio = t.wavUrl || t.mp3Url || t.previewUrl || null
    const knownPrice =
      productPricesRef.current.get(t.id) ??
      productPricesRef.current.get(pid) ??
      (t.slug ? productPricesRef.current.get(t.slug) : undefined) ??
      (t.priceCents > 0 ? t.priceCents : 99)

    return {
      ...t,
      isUnlocked,
      priceCents: knownPrice,
      wavUrl: isUnlocked ? t.wavUrl || fallbackAudio : t.wavUrl,
      mp3Url: isUnlocked ? t.mp3Url || fallbackAudio : t.mp3Url,
    }
  }, [])

  // Sync user's unlocked library items, admin status & real store prices so playing from anywhere always matches the store
  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const syncUnlockedEntitlements = async () => {
      try {
        const { data: prodRows } = await supabase
          .from('products')
          .select('id, slug, price_cents')
          .eq('is_published', true)

        if (prodRows) {
          for (const pr of prodRows) {
            if (typeof pr.price_cents === 'number' && pr.price_cents > 0) {
              if (pr.id) productPricesRef.current.set(pr.id, pr.price_cents)
              if (pr.slug) productPricesRef.current.set(pr.slug, pr.price_cents)
            }
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && mounted) {
          const isOwnerEmail =
            user.email?.toLowerCase() === 'angel.ivan34@gmail.com'
          const isMetaAdmin =
            user.user_metadata?.role === 'admin' ||
            user.app_metadata?.role === 'admin'

          let isAdmin = isOwnerEmail || isMetaAdmin
          if (!isAdmin) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle()
            if (prof?.role === 'admin') isAdmin = true
          }

          if (isAdmin) {
            isAdminUserRef.current = true
          }

          const { data: libRows } = await supabase
            .from('library_items')
            .select('product_id')
            .eq('user_id', user.id)

          if (libRows) {
            for (const row of libRows) {
              if (row.product_id) unlockedKeysRef.current.add(row.product_id)
            }
          }
        }

        if (!mounted) return

        // Upgrade any already-loaded tracks and activeTrack in state
        setTracks((prev) => prev.map((tr) => enrichTrackUnlockStatus(tr)))
        setActiveTrack((curr) => {
          if (!curr) return null
          const upgraded = enrichTrackUnlockStatus(curr)
          activeTrackRef.current = upgraded
          // If audio is already loaded and was previously capped at 30s, restore full duration
          const audio = audioRef.current
          if (
            upgraded.isUnlocked &&
            audio &&
            Number.isFinite(audio.duration) &&
            audio.duration > 0
          ) {
            setDuration(audio.duration)
          }
          return upgraded
        })
      } catch {
        // Ignore auth check errors for guests
      }
    }

    syncUnlockedEntitlements()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncUnlockedEntitlements()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [enrichTrackUnlockStatus])

  // Load cover artwork image for Canvas fallback PiP
  useEffect(() => {
    if (!activeTrack?.thumbnailUrl || typeof window === 'undefined') {
      coverImageRef.current = null
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      coverImageRef.current = img
    }
    img.onerror = () => {
      coverImageRef.current = null
    }
    img.src = activeTrack.thumbnailUrl
  }, [activeTrack?.thumbnailUrl])

  // Render canvas frame for Video PiP fallback
  const drawCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const track = activeTrackRef.current

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#0a0a0a')
    grad.addColorStop(0.6, '#170909')
    grad.addColorStop(1, '#3b0707')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const img = coverImageRef.current
    const artSize = 230
    const artX = (w - artSize) / 2
    const artY = 36

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(artX, artY, artSize, artSize, 20)
    ctx.clip()
    if (img) {
      try {
        ctx.drawImage(img, artX, artY, artSize, artSize)
      } catch {
        ctx.fillStyle = '#1f1f1f'
        ctx.fillRect(artX, artY, artSize, artSize)
      }
    } else {
      ctx.fillStyle = '#171717'
      ctx.fillRect(artX, artY, artSize, artSize)
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 42px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('999', w / 2, artY + artSize / 2 + 14)
    }
    ctx.restore()

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(artX, artY, artSize, artSize, 20)
    ctx.stroke()

    if (!track) return

    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    const badgeText = `SLEEPYRED999 • ${stemModeRef.current.toUpperCase()}`
    ctx.fillText(badgeText, w / 2, 294)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px sans-serif'
    const title =
      track.title.length > 30 ? track.title.slice(0, 29) + '…' : track.title
    ctx.fillText(title, w / 2, 326)

    const barX = 48
    const barY = 352
    const barW = w - 96
    const barH = 8
    ctx.fillStyle = '#262626'
    ctx.beginPath()
    ctx.roundRect(barX, barY, barW, barH, 4)
    ctx.fill()

    const dur = duration > 0 ? duration : 180
    const pct = Math.min(1, Math.max(0, currentTime / dur))
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    ctx.roundRect(barX, barY, Math.max(8, barW * pct), barH, 4)
    ctx.fill()

    const fmt = (s: number) => {
      if (!Number.isFinite(s) || s < 0) return '0:00'
      const m = Math.floor(s / 60)
      const sec = Math.floor(s % 60)
      return `${m}:${sec < 10 ? '0' : ''}${sec}`
    }
    ctx.fillStyle = '#a3a3a3'
    ctx.font = '13px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(fmt(currentTime), barX, 380)
    ctx.textAlign = 'right'
    ctx.fillText(duration > 0 ? fmt(duration) : '--:--', barX + barW, 380)
  }, [currentTime, duration])

  useEffect(() => {
    drawCanvasFrame()
  }, [drawCanvasFrame, activeTrack, stemMode, isPlaying])

  /**
   * Core imperative audio loader & player.
   * Prevents double-loads and handles instant playback even when switching between large WAV files.
   */
  const playAudioElement = useCallback((url: string, resetTime = false) => {
    const audio = audioRef.current
    if (!audio || !url) return

    const reqId = ++playRequestIdRef.current
    const needsSrcUpdate = loadedSrcRef.current !== url

    // Optimistically update UI state immediately so button never requires a double press
    isPlayingRef.current = true
    setIsPlaying(true)

    const startPlayback = () => {
      if (playRequestIdRef.current !== reqId) return
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (playRequestIdRef.current !== reqId) return
            isPlayingRef.current = true
            setIsPlaying(true)
            if (pipVideoRef.current && pipVideoRef.current.srcObject) {
              pipVideoRef.current.play().catch(() => {})
            }
          })
          .catch((err) => {
            if (playRequestIdRef.current !== reqId) return
            if (err?.name === 'AbortError') {
              // Wait for canplay if stream is still opening
              const onCanPlayRetry = () => {
                audio.removeEventListener('canplay', onCanPlayRetry)
                if (playRequestIdRef.current === reqId && isPlayingRef.current) {
                  audio.play().catch(() => {
                    isPlayingRef.current = false
                    setIsPlaying(false)
                  })
                }
              }
              audio.addEventListener('canplay', onCanPlayRetry, { once: true })
              return
            }
            isPlayingRef.current = false
            setIsPlaying(false)
          })
      }
    }

    if (needsSrcUpdate) {
      loadedSrcRef.current = url
      setCurrentTime(0)
      setDuration(0)
      audio.src = url
      audio.load()
      startPlayback()
    } else {
      if (resetTime) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      startPlayback()
    }
  }, [])

  const preloadTrackSilently = useCallback((track: PlayerTrack, mode: StemMode) => {
    const audio = audioRef.current
    if (!audio) return
    const url = resolveTrackAudioSource(track, mode)
    if (!url || loadedSrcRef.current === url) return
    loadedSrcRef.current = url
    audio.src = url
    audio.load()
  }, [])

  const setQueue = useCallback(
    (newTracks: PlayerTrack[], initialTrackId?: string | null) => {
      const enrichedList = applySavedQueueOrder(
        newTracks.map((t) => enrichTrackUnlockStatus(t))
      )
      tracksRef.current = enrichedList
      setTracks(enrichedList)

      if (initialTrackId) {
        const requested = enrichedList.find(
          (t) =>
            t.id === initialTrackId ||
            t.productId === initialTrackId ||
            t.slug === initialTrackId
        )
        if (requested && activeTrackRef.current?.id !== requested.id) {
          activeTrackRef.current = requested
          stemModeRef.current = 'master'
          setActiveTrack(requested)
          setStemMode('master')
          if (!isPlayingRef.current) {
            setCurrentTime(0)
            setDuration(0)
            preloadTrackSilently(requested, 'master')
          }
          return
        }
      }

      if (!activeTrackRef.current && enrichedList.length > 0) {
        const def = enrichedList.find((t) => t.isUnlocked) || enrichedList[0]
        activeTrackRef.current = def
        stemModeRef.current = 'master'
        setActiveTrack(def)
        setStemMode('master')
        preloadTrackSilently(def, 'master')
      } else if (activeTrackRef.current) {
        const updated = enrichedList.find(
          (t) =>
            t.id === activeTrackRef.current?.id ||
            (t.productId && t.productId === activeTrackRef.current?.productId)
        )
        if (updated) {
          const merged = enrichTrackUnlockStatus({
            ...updated,
            isUnlocked:
              activeTrackRef.current.isUnlocked || updated.isUnlocked,
          })
          activeTrackRef.current = merged
          setActiveTrack(merged)
        }
      }
    },
    [applySavedQueueOrder, enrichTrackUnlockStatus, preloadTrackSilently]
  )

  const moveTrackInQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      const list = [...tracksRef.current]
      if (
        fromIndex < 0 ||
        fromIndex >= list.length ||
        toIndex < 0 ||
        toIndex >= list.length ||
        fromIndex === toIndex
      ) {
        return
      }
      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)
      tracksRef.current = list
      setTracks(list)
      persistQueueOrder(list)
    },
    [persistQueueOrder]
  )

  const moveTrackById = useCallback(
    (trackId: string, direction: -1 | 1) => {
      const list = [...tracksRef.current]
      const idx = list.findIndex((t) => t.id === trackId)
      if (idx === -1) return
      const targetIdx = idx + direction
      if (targetIdx < 0 || targetIdx >= list.length) return
      const [moved] = list.splice(idx, 1)
      list.splice(targetIdx, 0, moved)
      tracksRef.current = list
      setTracks(list)
      persistQueueOrder(list)
    },
    [persistQueueOrder]
  )

  const playNextInQueue = useCallback(
    (rawTrack: PlayerTrack) => {
      const track = enrichTrackUnlockStatus(rawTrack)
      const list = [...tracksRef.current]
      const existingIdx = list.findIndex((t) => t.id === track.id)
      if (existingIdx !== -1) {
        list.splice(existingIdx, 1)
      }
      const activeIdx = activeTrackRef.current
        ? list.findIndex((t) => t.id === activeTrackRef.current?.id)
        : -1
      const insertAt = activeIdx === -1 ? 0 : activeIdx + 1
      list.splice(insertAt, 0, track)
      tracksRef.current = list
      setTracks(list)
      persistQueueOrder(list)

      if (!activeTrackRef.current) {
        activeTrackRef.current = track
        setActiveTrack(track)
        preloadTrackSilently(track, 'master')
      }
    },
    [enrichTrackUnlockStatus, persistQueueOrder, preloadTrackSilently]
  )

  const addToQueue = useCallback(
    (rawTrack: PlayerTrack) => {
      const track = enrichTrackUnlockStatus(rawTrack)
      const list = [...tracksRef.current]
      const exists = list.some((t) => t.id === track.id)
      if (!exists) {
        list.push(track)
        tracksRef.current = list
        setTracks(list)
        persistQueueOrder(list)
      }
      if (!activeTrackRef.current) {
        activeTrackRef.current = track
        setActiveTrack(track)
        preloadTrackSilently(track, 'master')
      }
    },
    [enrichTrackUnlockStatus, persistQueueOrder, preloadTrackSilently]
  )

  const removeFromQueue = useCallback(
    (trackId: string) => {
      const list = tracksRef.current.filter((t) => t.id !== trackId)
      tracksRef.current = list
      setTracks(list)
      persistQueueOrder(list)
    },
    [persistQueueOrder]
  )

  const shuffleQueue = useCallback(() => {
    const list = [...tracksRef.current]
    if (list.length <= 1) return
    const curr = activeTrackRef.current
    const rest = curr ? list.filter((t) => t.id !== curr.id) : list
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[rest[i], rest[j]] = [rest[j], rest[i]]
    }
    const nextList = curr ? [curr, ...rest] : rest
    tracksRef.current = nextList
    setTracks(nextList)
    persistQueueOrder(nextList)
  }, [persistQueueOrder])

  const toggleLoopMode = useCallback(() => {
    const next: LoopMode = loopModeRef.current === 'all' ? 'one' : 'all'
    loopModeRef.current = next
    setLoopMode(next)
  }, [])

  const selectAndPlayTrack = useCallback(
    (
      rawTrack: PlayerTrack,
      newStem: StemMode = 'master',
      queueIfMissing?: PlayerTrack[]
    ) => {
      const track = enrichTrackUnlockStatus(rawTrack)

      if (queueIfMissing && queueIfMissing.length > 0) {
        const map = new Map<string, PlayerTrack>()
        for (const item of tracksRef.current) {
          map.set(item.id, enrichTrackUnlockStatus(item))
        }
        for (const item of queueIfMissing) {
          const enrichedItem = enrichTrackUnlockStatus(item)
          const existing = map.get(enrichedItem.id)
          map.set(
            enrichedItem.id,
            existing
              ? enrichTrackUnlockStatus({
                  ...enrichedItem,
                  isUnlocked: existing.isUnlocked || enrichedItem.isUnlocked,
                })
              : enrichedItem
          )
        }
        const mergedQueue = Array.from(map.values())
        tracksRef.current = mergedQueue
        setTracks(mergedQueue)
      } else {
        const exists = tracksRef.current.some((t) => t.id === track.id)
        const nextQueue = exists
          ? tracksRef.current.map((t) =>
              t.id === track.id
                ? enrichTrackUnlockStatus({
                    ...track,
                    isUnlocked: t.isUnlocked || track.isUnlocked,
                  })
                : t
            )
          : [track, ...tracksRef.current]
        tracksRef.current = nextQueue
        setTracks(nextQueue)
      }

      // Check if existing queue has unlocked version of this track
      const queueMatch = tracksRef.current.find((t) => t.id === track.id)
      const finalTrack = queueMatch
        ? enrichTrackUnlockStatus({
            ...track,
            isUnlocked: track.isUnlocked || queueMatch.isUnlocked,
          })
        : track

      const isSameTrackAndStem =
        activeTrackRef.current?.id === finalTrack.id &&
        stemModeRef.current === newStem

      if (isSameTrackAndStem) {
        const audio = audioRef.current
        if (!audio) return
        if (isPlayingRef.current && !audio.paused) {
          playRequestIdRef.current += 1
          audio.pause()
          isPlayingRef.current = false
          setIsPlaying(false)
        } else {
          activeTrackRef.current = finalTrack
          setActiveTrack(finalTrack)
          const url = resolveTrackAudioSource(finalTrack, newStem)
          playAudioElement(url, false)
        }
        return
      }

      // Synchronously update refs BEFORE starting audio so metadata events see the exact track
      activeTrackRef.current = finalTrack
      stemModeRef.current = newStem
      setActiveTrack(finalTrack)
      setStemMode(newStem)

      const nextUrl = resolveTrackAudioSource(finalTrack, newStem)
      playAudioElement(nextUrl, true)

      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'song_play',
          targetType: 'product',
          targetId: finalTrack.productId || finalTrack.id,
          metadata: {
            slug: finalTrack.slug,
            name: finalTrack.title,
            stem: newStem,
            source: 'global_web_player',
          },
        }),
      }).catch(() => {})
    },
    [enrichTrackUnlockStatus, playAudioElement]
  )

  const togglePlay = useCallback(() => {
    const track = activeTrackRef.current
    if (!track) return
    const audio = audioRef.current
    if (!audio) return

    if (isPlayingRef.current && !audio.paused) {
      playRequestIdRef.current += 1
      audio.pause()
      isPlayingRef.current = false
      setIsPlaying(false)
    } else {
      const url = resolveTrackAudioSource(track, stemModeRef.current)
      playAudioElement(url, false)
    }
  }, [playAudioElement])

  const pause = useCallback(() => {
    playRequestIdRef.current += 1
    audioRef.current?.pause()
    isPlayingRef.current = false
    setIsPlaying(false)
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'paused'
      } catch {}
    }
  }, [])

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, time)
    setCurrentTime(clamped)
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = clamped
      if (
        typeof window !== 'undefined' &&
        'mediaSession' in navigator &&
        typeof navigator.mediaSession.setPositionState === 'function' &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(audio.duration, Math.max(0, clamped)),
          })
        } catch {}
      }
    }
  }, [])

  const stepTrack = useCallback(
    (direction: -1 | 1) => {
      const list = tracksRef.current
      const curr = activeTrackRef.current
      if (list.length === 0 || !curr) return
      const idx = list.findIndex((t) => t.id === curr.id)
      const nextIdx =
        idx === -1 ? 0 : (idx + direction + list.length) % list.length
      selectAndPlayTrack(list[nextIdx], 'master')
    },
    [selectAndPlayTrack]
  )

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    const next = !isMuted
    audioRef.current.muted = next
    setIsMuted(next)
  }, [isMuted])

  const setVolume = useCallback((val: number) => {
    const v = Math.min(1, Math.max(0, val))
    setVolumeState(v)
    if (audioRef.current) {
      audioRef.current.volume = v
      if (v > 0 && audioRef.current.muted) {
        audioRef.current.muted = false
        setIsMuted(false)
      }
    }
  }, [])

  const closePlayer = useCallback(() => {
    playRequestIdRef.current += 1
    audioRef.current?.pause()
    isPlayingRef.current = false
    setIsPlaying(false)
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none'
      } catch {}
    }
    if (pipWindow) {
      try {
        pipWindow.close()
      } catch {}
    }
    activeTrackRef.current = null
    setActiveTrack(null)
  }, [pipWindow])

  // Build iOS / Android Lock Screen & Notification Bar compatible raster artwork array with absolute URLs
  const syncMediaSessionAll = useCallback(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return
    const track = activeTrackRef.current
    if (!track) return

    try {
      const rawThumb = normalizeMediaUrl(track.thumbnailUrl) || '/images/logos/PNG-04.png'
      // iOS SpringBoard / Lock Screen requires raster images (PNG/JPEG/WebP), not SVG, and requires absolute URLs
      const rasterPath = rawThumb.toLowerCase().endsWith('.svg')
        ? '/images/logos/PNG-04.png'
        : rawThumb
      const absoluteArtUrl = new URL(rasterPath, window.location.origin).href
      const lowerUrl = absoluteArtUrl.toLowerCase()
      const mimeType = lowerUrl.endsWith('.png')
        ? 'image/png'
        : lowerUrl.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg'

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'sleepyred999',
        album: `sleepyred999 • ${stemModeRef.current.toUpperCase()}`,
        artwork: [
          { src: absoluteArtUrl, sizes: '96x96', type: mimeType },
          { src: absoluteArtUrl, sizes: '128x128', type: mimeType },
          { src: absoluteArtUrl, sizes: '192x192', type: mimeType },
          { src: absoluteArtUrl, sizes: '256x256', type: mimeType },
          { src: absoluteArtUrl, sizes: '384x384', type: mimeType },
          { src: absoluteArtUrl, sizes: '512x512', type: mimeType },
        ],
      })

      navigator.mediaSession.playbackState = isPlayingRef.current
        ? 'playing'
        : 'paused'

      const audio = audioRef.current
      if (
        audio &&
        typeof navigator.mediaSession.setPositionState === 'function' &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate || 1,
          position: Math.min(
            audio.duration,
            Math.max(0, audio.currentTime || 0)
          ),
        })
      }

      navigator.mediaSession.setActionHandler('play', () => {
        const curr = activeTrackRef.current
        if (!curr) return
        const url = resolveTrackAudioSource(curr, stemModeRef.current)
        playAudioElement(url, false)
      })
      navigator.mediaSession.setActionHandler('pause', () => {
        pause()
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        stepTrack(-1)
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        stepTrack(1)
      })
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10
        const nextTime = Math.max(0, (audioRef.current?.currentTime || 0) - offset)
        seek(nextTime)
      })
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10
        const dur = audioRef.current?.duration || Infinity
        const nextTime = Math.min(dur, (audioRef.current?.currentTime || 0) + offset)
        seek(nextTime)
      })
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          seek(details.seekTime)
        }
      })
    } catch {
      // Ignore unsupported MediaSession actions
    }
  }, [playAudioElement, pause, stepTrack, seek])

  // Audio Element Event Listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncDurationFromAudio = () => {
      const rawDur = audio.duration
      if (Number.isFinite(rawDur) && rawDur > 0) {
        setDuration(rawDur)
      }
      syncMediaSessionAll()
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const onPlay = () => {
      isPlayingRef.current = true
      setIsPlaying(true)
      syncMediaSessionAll()
    }

    const onPause = () => {
      // Do not flip isPlaying to false if pause was just triggered by src replacement during a track switch
      if (audio.ended) return
      isPlayingRef.current = false
      setIsPlaying(false)
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused'
        } catch {}
      }
    }

    const onEnded = () => {
      const list = tracksRef.current
      const curr = activeTrackRef.current
      if (loopModeRef.current === 'one' && curr) {
        const url = resolveTrackAudioSource(curr, stemModeRef.current)
        playAudioElement(url, true)
        return
      }
      if (list.length > 1 && curr) {
        const idx = list.findIndex((t) => t.id === curr.id)
        if (idx !== -1) {
          const nextIdx = (idx + 1) % list.length
          selectAndPlayTrack(list[nextIdx], 'master')
          return
        }
      }
      isPlayingRef.current = false
      setIsPlaying(false)
      setCurrentTime(0)
      if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused'
        } catch {}
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', syncDurationFromAudio)
    audio.addEventListener('durationchange', syncDurationFromAudio)
    audio.addEventListener('canplay', syncDurationFromAudio)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', syncDurationFromAudio)
      audio.removeEventListener('durationchange', syncDurationFromAudio)
      audio.removeEventListener('canplay', syncDurationFromAudio)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [selectAndPlayTrack, playAudioElement, syncMediaSessionAll])

  // Keep MediaSession API synchronized when track, stem, or playback state changes
  useEffect(() => {
    syncMediaSessionAll()
  }, [activeTrack, stemMode, isPlaying, syncMediaSessionAll])

  // Picture-in-Picture (Document PiP primary + lazy Canvas Video PiP fallback on desktop)
  const togglePiP = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (pipWindow) {
      try {
        pipWindow.close()
      } catch {}
      setPipWindow(null)
      setPipContainer(null)
      setIsPiPActive(false)
      return
    }

    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture()
      } catch {}
      setIsPiPActive(false)
      return
    }

    const docPiP = (
      window as Window & {
        documentPictureInPicture?: {
          requestWindow: (opts: {
            width: number
            height: number
          }) => Promise<Window>
        }
      }
    ).documentPictureInPicture

    if (docPiP && typeof docPiP.requestWindow === 'function') {
      try {
        const win = await docPiP.requestWindow({
          width: 380,
          height: 250,
        })

        win.document.title = activeTrackRef.current
          ? `${activeTrackRef.current.title} — sleepyred999`
          : 'sleepyred999 Player'

        const style = win.document.createElement('style')
        style.textContent = `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            height: 100%;
            background: #09090b;
            color: #fafafa;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            user-select: none;
          }
          input[type="range"] {
            accent-color: #dc2626;
            cursor: pointer;
          }
          button {
            cursor: pointer;
            border: none;
            background: none;
            color: inherit;
            font: inherit;
          }
        `
        win.document.head.appendChild(style)

        const mountNode = win.document.createElement('div')
        mountNode.style.width = '100%'
        mountNode.style.height = '100%'
        win.document.body.appendChild(mountNode)

        win.addEventListener('pagehide', () => {
          setPipWindow(null)
          setPipContainer(null)
          setIsPiPActive(false)
        })

        setPipWindow(win)
        setPipContainer(mountNode)
        setIsPiPActive(true)
        return
      } catch {
        // Fall through to Video PiP fallback
      }
    }

    const canvas = canvasRef.current
    if (
      canvas &&
      typeof (
        canvas as HTMLCanvasElement & {
          captureStream?: (fps?: number) => MediaStream
        }
      ).captureStream === 'function'
    ) {
      try {
        if (!pipVideoRef.current) {
          const v = document.createElement('video')
          v.muted = true
          v.playsInline = true
          v.style.position = 'fixed'
          v.style.width = '1px'
          v.style.height = '1px'
          v.style.opacity = '0'
          v.style.pointerEvents = 'none'
          v.addEventListener('leavepictureinpicture', () => {
            setIsPiPActive(false)
          })
          document.body.appendChild(v)
          pipVideoRef.current = v
        }
        const video = pipVideoRef.current
        drawCanvasFrame()
        if (!video.srcObject) {
          const stream = (
            canvas as HTMLCanvasElement & {
              captureStream: (fps?: number) => MediaStream
            }
          ).captureStream(15)
          video.srcObject = stream
        }
        await video.play()
        if (
          typeof (
            video as HTMLVideoElement & {
              requestPictureInPicture?: () => Promise<PictureInPictureWindow>
            }
          ).requestPictureInPicture === 'function'
        ) {
          await video.requestPictureInPicture()
          setIsPiPActive(true)
          return
        }
      } catch {
        // Fallback to minimized in-app floating tab if OS PiP is blocked
      }
    }

    setIsMinimized(true)
  }, [pipWindow, drawCanvasFrame, setIsMinimized])

  return (
    <GlobalPlayerContext.Provider
      value={{
        tracks,
        activeTrack,
        stemMode,
        loopMode,
        isPlaying,
        currentTime,
        duration,
        isMuted,
        volume,
        isMinimized,
        playerViewMode,
        isPiPActive,
        pipWindow,
        pipContainer,
        setQueue,
        selectAndPlayTrack,
        moveTrackInQueue,
        moveTrackById,
        playNextInQueue,
        addToQueue,
        removeFromQueue,
        shuffleQueue,
        toggleLoopMode,
        togglePlay,
        pause,
        seek,
        stepTrack,
        toggleMute,
        setVolume,
        setIsMinimized,
        setPlayerViewMode,
        openExpandedWidget,
        collapseFromWidget,
        togglePiP,
        closePlayer,
      }}
    >
      {/* Persistent Singleton Audio Element (sr-only so iOS Safari Now Playing treats it as active primary media) */}
      <audio ref={audioRef} playsInline preload="metadata" className="sr-only" />
      {/* Hidden Canvas for Native Video PiP Fallback */}
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        className="hidden pointer-events-none"
      />
      {children}
    </GlobalPlayerContext.Provider>
  )
}
