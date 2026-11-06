'use client'

import React, {
  useState,
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Edit3,
  Loader2,
  Check,
  Music,
  ImageIcon,
  User,
  Upload,
  Camera,
  Sparkles,
  Cake,
  UserCheck,
  ExternalLink,
  Library,
  Plus,
  X,
  Disc,
  Wand2,
  ShieldCheck,
} from 'lucide-react'
import {
  updateProfile,
  quickCustomizeProfile,
  type ProfileActionState,
} from './actions'
import {
  BANNER_PRESETS,
  AVATAR_PRESETS,
  SONG_PRESETS,
  STICKER_PRESETS,
  extractProfileFavSongId,
  extractProfileStatus,
  extractProfileStickers,
  getStickersByIds,
  type SongPreset,
} from '@/lib/profile-presets'
import { FavoriteSongSnippetPlayer } from '@/components/profile/FavoriteSongSnippetPlayer'
import type { Profile } from '@/lib/types'

export type UnlockedArtworkOption = {
  id: string
  title: string
  url: string
  isUnlocked: boolean
}

type CustomizerTab = 'avatar' | 'banner' | 'stickers' | 'music' | 'identity'

type ProfileEditFormProps = {
  profile: Profile | null
  availableSongs?: SongPreset[]
  unlockedArtworks?: UnlockedArtworkOption[]
  isAdmin?: boolean
  fallbackEmail?: string | null
}

const initialState: ProfileActionState = {}

export function ProfileEditForm({
  profile,
  availableSongs,
  unlockedArtworks = [],
  isAdmin = false,
  fallbackEmail = null,
}: ProfileEditFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  )
  const [isQuickSaving, startQuickTransition] = useTransition()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const songsList =
    availableSongs && availableSongs.length > 0 ? availableSongs : SONG_PRESETS

  const initialName =
    profile?.display_name || fallbackEmail?.split('@')[0] || 'Miembro'
  const initialUsername =
    profile?.username || fallbackEmail?.split('@')[0] || 'user'
  const initialFavSongId = extractProfileFavSongId(profile) || songsList[0].id
  const cleanInitialStatus =
    extractProfileStatus(profile?.status_update) ||
    'Disfrutando los lanzamientos oficiales en máster sin compresión.'
  const initialStickers = extractProfileStickers(profile?.status_update)

  // Live optimistic state so every 1-click change reflects immediately on the profile
  const [liveName, setLiveName] = useState(initialName)
  const [liveUsername, setLiveUsername] = useState(initialUsername)
  const [liveBanner, setLiveBanner] = useState(
    profile?.banner_url || BANNER_PRESETS[0].url
  )
  const [liveAvatar, setLiveAvatar] = useState(
    profile?.avatar_url || AVATAR_PRESETS[0].url
  )
  const [liveSongId, setLiveSongId] = useState(initialFavSongId)
  const [liveStickers, setLiveStickers] = useState<string[]>(initialStickers)
  const [liveStatus, setLiveStatus] = useState(cleanInitialStatus)
  const [liveBio, setLiveBio] = useState(
    profile?.bio ||
      'Miembro oficial de la comunidad sleepyred999. Apoyando producciones musicales y drops exclusivos.'
  )
  const [liveBirthday, setLiveBirthday] = useState(profile?.birthday || '')
  const [liveGender, setLiveGender] = useState<
    'male' | 'female' | 'gender_neutral' | 'unspecified'
  >(profile?.gender || 'unspecified')

  // Inline quick-editing states
  const [isEditingStatusInline, setIsEditingStatusInline] = useState(false)
  const [statusDraft, setStatusDraft] = useState(cleanInitialStatus)

  // Modal dialog & active tab (Facebook / Steam Dota 2 Loadout style)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const avatarUploadFormRef = useRef<HTMLFormElement | null>(null)
  const bannerUploadFormRef = useRef<HTMLFormElement | null>(null)
  const [activeTab, setActiveTab] = useState<CustomizerTab>('stickers')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Reactive pointer coordinates on the hero banner for tactile depth
  const [pointerPos, setPointerPos] = useState({ x: 50, y: 50 })

  useEffect(() => {
    if (profile?.banner_url) setLiveBanner(profile.banner_url)
    if (profile?.avatar_url) setLiveAvatar(profile.avatar_url)
    if (profile?.display_name) setLiveName(profile.display_name)
    if (profile?.username) setLiveUsername(profile.username)
    if (profile?.bio) setLiveBio(profile.bio)
    if (profile?.birthday) setLiveBirthday(profile.birthday)
    if (profile?.gender) setLiveGender(profile.gender)
    const favId = extractProfileFavSongId(profile)
    if (favId) setLiveSongId(favId)
    const st = extractProfileStatus(profile?.status_update)
    if (st) {
      setLiveStatus(st)
      setStatusDraft(st)
    }
    setLiveStickers(extractProfileStickers(profile?.status_update))
  }, [profile])

  const showQuickToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 2600)
  }

  useEffect(() => {
    if (state?.success) {
      showQuickToast('✓ Imagen subida y aplicada a tu perfil')
      router.refresh()
    }
  }, [state, router])

  // Modern Web Guidance: Fallback for browsers without native <dialog closedby="any"> support (e.g. Safari)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const onClose = () => setIsDialogOpen(false)
    dialog.addEventListener('close', onClose)

    let onBackdropClick: ((event: MouseEvent) => void) | null = null
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      onBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return
        const rect = dialog.getBoundingClientRect()
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        if (isDialogContent) return
        dialog.close()
      }
      dialog.addEventListener('click', onBackdropClick)
    }

    return () => {
      dialog.removeEventListener('close', onClose)
      if (onBackdropClick) {
        dialog.removeEventListener('click', onBackdropClick)
      }
    }
  }, [])

  const openCustomizerOnTab = (tab: CustomizerTab) => {
    setActiveTab(tab)
    setIsDialogOpen(true)
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }

  const closeCustomizer = () => {
    const dialog = dialogRef.current
    if (dialog && dialog.open) {
      dialog.close()
    }
    setIsDialogOpen(false)
  }

  // One-click instant save handlers
  const handleInstantAvatarSelect = (url: string, label: string) => {
    setLiveAvatar(url)
    showQuickToast(`✓ Foto de perfil cambiada: ${label}`)
    startQuickTransition(async () => {
      await quickCustomizeProfile({ avatarUrl: url })
      router.refresh()
    })
  }

  const handleInstantBannerSelect = (url: string, label: string) => {
    setLiveBanner(url)
    showQuickToast(`✓ Portada actualizada: ${label}`)
    startQuickTransition(async () => {
      await quickCustomizeProfile({ bannerUrl: url })
      router.refresh()
    })
  }

  const handleInstantStickerToggle = (stickerId: string) => {
    const exists = liveStickers.includes(stickerId)
    let next: string[]
    if (exists) {
      next = liveStickers.filter((id) => id !== stickerId)
    } else {
      if (liveStickers.length >= 4) {
        next = [...liveStickers.slice(1), stickerId]
      } else {
        next = [...liveStickers, stickerId]
      }
    }
    setLiveStickers(next)
    const stickerObj = STICKER_PRESETS.find((s) => s.id === stickerId)
    showQuickToast(
      exists
        ? `Sticker retirado: ${stickerObj?.label || stickerId}`
        : `✨ Sticker equipado: ${stickerObj?.label || stickerId}`
    )
    startQuickTransition(async () => {
      await quickCustomizeProfile({ stickers: next })
      router.refresh()
    })
  }

  const handleInstantSongSelect = (songId: string) => {
    setLiveSongId(songId)
    const songObj = songsList.find((s) => s.id === songId)
    showQuickToast(`🎵 Himno de perfil: ${songObj?.title || songId}`)
    startQuickTransition(async () => {
      await quickCustomizeProfile({ favoriteSongId: songId })
      router.refresh()
    })
  }

  const handleInlineStatusSave = () => {
    const trimmed = statusDraft.trim()
    setLiveStatus(trimmed || cleanInitialStatus)
    setIsEditingStatusInline(false)
    showQuickToast('✓ Estado actualizado al instante')
    startQuickTransition(async () => {
      await quickCustomizeProfile({ statusUpdate: trimmed })
      router.refresh()
    })
  }

  const handleIdentitySave = (e: React.FormEvent) => {
    e.preventDefault()
    showQuickToast('✓ Datos de perfil guardados')
    startQuickTransition(async () => {
      await quickCustomizeProfile({
        displayName: liveName,
        username: liveUsername,
        statusUpdate: liveStatus,
        bio: liveBio,
        birthday: liveBirthday || null,
        gender: liveGender,
      })
      router.refresh()
      closeCustomizer()
    })
  }

  const activeSongObj =
    songsList.find((s) => s.id === liveSongId) || songsList[0]
  const equippedStickerObjects = getStickersByIds(liveStickers)

  // Build deduplicated unlocked song cover artworks list for 1-click Avatar & Banner selection
  const songCoverOptions: UnlockedArtworkOption[] = React.useMemo(() => {
    const map = new Map<string, UnlockedArtworkOption>()
    for (const item of unlockedArtworks) {
      if (item.url && !map.has(item.url)) {
        map.set(item.url, item)
      }
    }
    for (const s of songsList) {
      if (s.thumbnailUrl && !map.has(s.thumbnailUrl)) {
        map.set(s.thumbnailUrl, {
          id: s.id,
          title: s.title,
          url: s.thumbnailUrl,
          isUnlocked: true,
        })
      }
    }
    return Array.from(map.values())
  }, [unlockedArtworks, songsList])

  const getGenderLabel = (g?: string | null) => {
    switch (g) {
      case 'male':
        return 'Hombre ♂'
      case 'female':
        return 'Mujer ♀'
      case 'gender_neutral':
        return 'Género Neutro ⚥'
      default:
        return 'No especificado'
    }
  }

  return (
    <div className="space-y-6">
      {/* Floating Live Save Toast Pill */}
      {(toastMessage || isQuickSaving || pending) && (
        <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-950/95 border border-red-600/80 text-xs font-mono font-bold text-white shadow-2xl shadow-red-950/70 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {isQuickSaving || pending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span>Sincronizando cambios en vivo...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </>
          )}
        </div>
      )}

      {/* Hidden Instant File Upload Forms for 1-Click Direct Photo / Banner Upload */}
      <form ref={avatarUploadFormRef} action={formAction} className="hidden">
        <input type="hidden" name="display_name" value={liveName} />
        <input type="hidden" name="username" value={liveUsername} />
        <input type="hidden" name="bio" value={liveBio} />
        <input type="hidden" name="status_update" value={liveStatus} />
        <input type="hidden" name="birthday" value={liveBirthday} />
        <input type="hidden" name="gender" value={liveGender} />
        <input type="hidden" name="banner_url" value={liveBanner} />
        <input type="hidden" name="avatar_url" value={liveAvatar} />
        <input type="hidden" name="favorite_product_id" value={liveSongId} />
        <input type="hidden" name="stickers" value={liveStickers.join(',')} />
        <input
          id="quick-avatar-file-input"
          type="file"
          name="avatar_file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const preview = URL.createObjectURL(f)
            setLiveAvatar(preview)
            showQuickToast(`Subiendo nueva foto: ${f.name}...`)
            avatarUploadFormRef.current?.requestSubmit()
          }}
        />
      </form>

      <form ref={bannerUploadFormRef} action={formAction} className="hidden">
        <input type="hidden" name="display_name" value={liveName} />
        <input type="hidden" name="username" value={liveUsername} />
        <input type="hidden" name="bio" value={liveBio} />
        <input type="hidden" name="status_update" value={liveStatus} />
        <input type="hidden" name="birthday" value={liveBirthday} />
        <input type="hidden" name="gender" value={liveGender} />
        <input type="hidden" name="banner_url" value={liveBanner} />
        <input type="hidden" name="avatar_url" value={liveAvatar} />
        <input type="hidden" name="favorite_product_id" value={liveSongId} />
        <input type="hidden" name="stickers" value={liveStickers.join(',')} />
        <input
          id="quick-banner-file-input"
          type="file"
          name="banner_file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const preview = URL.createObjectURL(f)
            setLiveBanner(preview)
            showQuickToast(`Subiendo nueva portada: ${f.name}...`)
            bannerUploadFormRef.current?.requestSubmit()
          }}
        />
      </form>

      {/* =====================================================================
          FACEBOOK + STEAM DOTA 2 INTERACTIVE HERO BANNER & AVATAR SHOWCASE
         ===================================================================== */}
      <section
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
          const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
          setPointerPos({ x, y })
        }}
        className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.85)] group/hero transition-all duration-300 hover:border-red-900/60"
      >
        {/* Interactive Widescreen Cover Banner (Facebook Style) */}
        <div className="relative w-full h-52 sm:h-72 bg-neutral-900 overflow-hidden select-none">
          <Image
            src={liveBanner}
            alt="Portada de Perfil"
            fill
            priority
            unoptimized={
              liveBanner.endsWith('.svg') || liveBanner.startsWith('blob:')
            }
            className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover/hero:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 896px"
          />

          {/* Tactile cursor spotlight overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(500px circle at ${pointerPos.x}% ${pointerPos.y}%, rgba(220, 38, 38, 0.18), transparent 65%)`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-black/20" />

          {/* Top-Left: Steam / Dota 2 Interactive Sticker Showcase Dock */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 z-10">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {equippedStickerObjects.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => openCustomizerOnTab('stickers')}
                  title={`${sticker.name} — Clic para cambiar stickers`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border bg-gradient-to-r ${sticker.bgGradient} ${sticker.borderClass} ${sticker.textClass} backdrop-blur-md shadow-lg text-[10px] sm:text-[11px] font-mono font-extrabold tracking-wider uppercase transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:rotate-1 active:scale-95 cursor-pointer`}
                >
                  <span className="text-sm sm:text-base drop-shadow">
                    {sticker.emoji}
                  </span>
                  <span>{sticker.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => openCustomizerOnTab('stickers')}
                title="Añadir o cambiar Stickers de tu vitrina (Estilo Dota 2 / Steam)"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/65 hover:bg-red-950/80 border border-white/15 hover:border-red-500/70 text-[10px] font-mono font-bold text-neutral-200 hover:text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-red-400" />
                <span>Stickers ({equippedStickerObjects.length}/4)</span>
              </button>
            </div>

            {/* Facebook-style Top/Bottom Right "Cambiar Portada" Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openCustomizerOnTab('banner')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-neutral-900/95 text-white border border-white/15 hover:border-red-500/70 backdrop-blur-md text-xs font-bold shadow-xl transition-all active:scale-95 cursor-pointer"
                title="Elegir portada de canciones desbloqueadas o subir foto"
              >
                <Camera className="w-3.5 h-3.5 text-red-400" />
                <span>Cambiar Portada</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Avatar & Main Action Bar */}
        <div className="relative px-5 sm:px-7 pb-6 pt-0 -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
          <div className="flex items-end gap-4">
            {/* Facebook-Style Interactive Profile Picture with Hover Camera & Quick Badge */}
            <div className="relative group/avatar shrink-0">
              <button
                type="button"
                onClick={() => openCustomizerOnTab('avatar')}
                title="Haz clic para cambiar tu foto de perfil (Portadas desbloqueadas o subir foto)"
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-neutral-950 bg-neutral-900 shadow-2xl ring-2 ring-red-600/60 group-hover/avatar:ring-red-500 transition-all duration-300 group-hover/avatar:scale-[1.02] active:scale-95 cursor-pointer block"
              >
                <Image
                  src={liveAvatar}
                  alt={liveName}
                  fill
                  unoptimized={
                    liveAvatar.endsWith('.svg') ||
                    liveAvatar.startsWith('blob:')
                  }
                  className="object-cover"
                  sizes="128px"
                />
                {/* Hover/Touch Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2 text-center">
                  <Camera className="w-5 h-5 text-red-400" />
                  <span className="text-[10px] font-mono font-bold uppercase leading-tight">
                    Cambiar Foto
                  </span>
                </div>
              </button>

              {/* Corner Camera Badge (Facebook style) */}
              <button
                type="button"
                onClick={() => openCustomizerOnTab('avatar')}
                title="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 border-2 border-neutral-950 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 pb-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openCustomizerOnTab('identity')}
                  title="Clic para editar tu nombre o @usuario"
                  className="text-left group/name cursor-pointer flex items-center gap-1.5"
                >
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white group-hover/name:text-red-300 tracking-tight truncate transition-colors">
                    {liveName}
                  </h1>
                  <Edit3 className="w-3.5 h-3.5 text-neutral-500 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                </button>
                {isAdmin && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950 border border-red-900 px-2.5 py-0.5 rounded-full shadow-sm inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-red-400" /> Creador /
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-neutral-400">
                @{liveUsername}
              </p>
            </div>
          </div>

          {/* Action Buttons: 1-Click Steam/Dota 2 Customizer + Public Profile + Library */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openCustomizerOnTab('avatar')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-red-700 via-red-600 to-rose-600 hover:from-red-600 hover:to-red-500 shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Personalizar Vitrina</span>
            </button>

            <Link
              href={`/u/${liveUsername}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors shadow-sm"
            >
              <span>Perfil Público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-200 hover:text-white bg-red-950/60 border border-red-800/60 hover:bg-red-900/70 transition-colors shadow-sm"
            >
              <Library className="w-3.5 h-3.5 text-red-400" />
              <span>Mi Biblioteca</span>
            </Link>
          </div>
        </div>

        {/* Quick 1-Click Customization Strip (Dota 2 / Steam Loadout Bar) */}
        <div className="px-5 sm:px-7 py-3 bg-neutral-900/60 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              Edición Rápida 1-Clic:
            </span>
            <button
              type="button"
              onClick={() => openCustomizerOnTab('avatar')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-700/60 text-[11px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <User className="w-3 h-3 text-red-400" />
              <span>Foto ({songCoverOptions.length} portadas)</span>
            </button>
            <button
              type="button"
              onClick={() => openCustomizerOnTab('banner')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-700/60 text-[11px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <ImageIcon className="w-3 h-3 text-red-400" />
              <span>Portada</span>
            </button>
            <button
              type="button"
              onClick={() => openCustomizerOnTab('stickers')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-700/60 text-[11px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Stickers ({equippedStickerObjects.length}/4)</span>
            </button>
            <button
              type="button"
              onClick={() => openCustomizerOnTab('music')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-700/60 text-[11px] font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <Music className="w-3 h-3 text-red-400" />
              <span>Himno</span>
            </button>
          </div>

          <Link
            href="/orders"
            className="text-[11px] font-mono text-neutral-400 hover:text-red-300 transition-colors"
          >
            Ver Mis Pedidos →
          </Link>
        </div>
      </section>

      {/* =====================================================================
          INLINE CLICK-TO-EDIT STATUS UPDATE BAR
         ===================================================================== */}
      <section className="bg-neutral-900/60 border border-neutral-800 hover:border-red-900/50 p-4 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Sparkles className="w-5 h-5 text-red-400 shrink-0" />
          {isEditingStatusInline ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                autoFocus
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineStatusSave()
                  if (e.key === 'Escape') setIsEditingStatusInline(false)
                }}
                placeholder="¿Qué estás escuchando o produciendo hoy?"
                className="w-full bg-neutral-950 border border-red-600/80 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-sans"
              />
              <button
                type="button"
                onClick={handleInlineStatusSave}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shrink-0 cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingStatusInline(false)}
                className="p-1.5 rounded-xl bg-neutral-950 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStatusDraft(liveStatus)
                setIsEditingStatusInline(true)
              }}
              title="Haz clic para cambiar tu estado al instante"
              className="min-w-0 flex-1 text-left group/status cursor-pointer"
            >
              <span className="text-[10px] font-mono uppercase text-red-400 font-bold flex items-center gap-1.5">
                <span>Estado Actual</span>
                <span className="text-neutral-500 group-hover/status:text-red-300 font-normal">
                  (clic para editar)
                </span>
              </span>
              <p className="text-xs sm:text-sm font-medium text-neutral-200 group-hover/status:text-white italic truncate">
                &ldquo;{liveStatus}&rdquo;
              </p>
            </button>
          )}
        </div>
      </section>

      {/* =====================================================================
          GRID: HIMNO DE PERFIL (FULL TRACK) & BIO / VITRINA DE STICKERS
         ===================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-red-500" /> Himno Fijo de tu
                Perfil
              </span>
              <button
                type="button"
                onClick={() => openCustomizerOnTab('music')}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 font-bold cursor-pointer"
              >
                Cambiar Canción ↻
              </button>
            </div>
            <FavoriteSongSnippetPlayer song={activeSongObj} />
          </div>

          {/* Cumpleaños y Género (Clic para editar rápido) */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => openCustomizerOnTab('identity')}
              className="bg-neutral-900/50 hover:bg-neutral-900 p-3 rounded-2xl border border-neutral-800/80 hover:border-red-900/50 space-y-1 text-left transition-all cursor-pointer"
            >
              <span className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-pink-400" /> Cumpleaños
                </span>
                <Edit3 className="w-2.5 h-2.5 text-neutral-600" />
              </span>
              <span className="text-neutral-200 font-semibold block">
                {liveBirthday || 'Añadir fecha'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openCustomizerOnTab('identity')}
              className="bg-neutral-900/50 hover:bg-neutral-900 p-3 rounded-2xl border border-neutral-800/80 hover:border-red-900/50 space-y-1 text-left transition-all cursor-pointer"
            >
              <span className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" /> Género
                </span>
                <Edit3 className="w-2.5 h-2.5 text-neutral-600" />
              </span>
              <span className="text-neutral-200 font-semibold block">
                {getGenderLabel(liveGender)}
              </span>
            </button>
          </div>
        </div>

        {/* Biografía & Vitrina Rápida de Portadas Desbloqueadas */}
        <div className="md:col-span-6 border border-neutral-800/90 rounded-2xl p-5 bg-neutral-900/40 backdrop-blur-md flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-bold text-white">
                  Sobre Mí & Colección Visual
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openCustomizerOnTab('identity')}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" /> Editar Bio
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {liveBio}
            </p>
          </div>

          {/* 1-Click Quick Cover Art Switcher right on the card */}
          <div className="pt-3 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                Portadas Desbloqueadas (1-Clic a Foto de Perfil):
              </span>
              <button
                type="button"
                onClick={() => openCustomizerOnTab('avatar')}
                className="text-[10px] font-mono text-red-400 hover:text-red-300 cursor-pointer"
              >
                Ver todas →
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {songCoverOptions.map((art) => {
                const isEquippedAvatar = liveAvatar === art.url
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => handleInstantAvatarSelect(art.url, art.title)}
                    title={`Usar portada de "${art.title}" como Foto de Perfil`}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                      isEquippedAvatar
                        ? 'border-red-500 ring-2 ring-red-500/50 shadow-lg'
                        : 'border-neutral-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={art.url}
                      alt={art.title}
                      fill
                      unoptimized={art.url.endsWith('.svg')}
                      className="object-cover"
                      sizes="48px"
                    />
                    {isEquippedAvatar && (
                      <span className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                )
              })}

              <label
                htmlFor="quick-avatar-file-input"
                title="Subir tu propia imagen desde tu dispositivo"
                className="w-12 h-12 rounded-xl border-2 border-dashed border-neutral-700 hover:border-red-500 bg-neutral-950 text-neutral-400 hover:text-white flex flex-col items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[8px] font-mono mt-0.5">Subir</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          NATIVE <dialog closedby="any"> STEAM / DOTA 2 1-CLICK CUSTOMIZER MODAL
         ===================================================================== */}
      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby="profile-customizer-title"
        className="m-auto w-[95vw] max-w-3xl rounded-3xl border border-red-900/60 bg-neutral-950 text-white p-0 shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop:bg-black/75 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 duration-200"
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-3 bg-gradient-to-r from-neutral-950 via-red-950/25 to-neutral-950">
            <div className="flex items-center gap-2.5">
              <Wand2 className="w-5 h-5 text-red-500" />
              <div>
                <h2
                  id="profile-customizer-title"
                  className="text-base font-extrabold text-white tracking-tight"
                >
                  Vitrina & Personalización 1-Clic
                </h2>
                <p className="text-[11px] font-mono text-neutral-400">
                  Haz clic en cualquier portada, emblema o sticker para
                  equiparlo al instante
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCustomizer}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              title="Cerrar (Esc o clic fuera)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 border-b border-neutral-800 flex items-center gap-1.5 overflow-x-auto bg-neutral-950">
            {(
              [
                { id: 'avatar', label: '🖼️ Foto de Perfil' },
                { id: 'banner', label: '🏞️ Portada / Banner' },
                { id: 'stickers', label: '✨ Stickers (Dota 2)' },
                { id: 'music', label: '🎵 Himno Musical' },
                { id: 'identity', label: '👤 Identidad & Bio' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? 'border-red-500 text-white bg-red-950/30'
                    : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* TAB 1: AVATAR (Unlocked Song Cover Arts + Studio Emblems + Custom Upload) */}
            {activeTab === 'avatar' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500 shrink-0">
                      <Image
                        src={liveAvatar}
                        alt="Avatar actual"
                        fill
                        unoptimized={
                          liveAvatar.endsWith('.svg') ||
                          liveAvatar.startsWith('blob:')
                        }
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">
                        Subir tu propia Foto de Perfil
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Sube cualquier imagen JPG, PNG, WebP o GIF desde tu
                        dispositivo y se aplicará automáticamente.
                      </p>
                    </div>
                  </div>
                  <label
                    htmlFor="quick-avatar-file-input"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Imagen Propia</span>
                  </label>
                </div>

                {/* Unlocked Song Cover Arts as Profile Picture */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5" /> Portadas de Canciones
                    Desbloqueadas (Clic para Equipar)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {songCoverOptions.map((art) => {
                      const isSelected = liveAvatar === art.url
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() =>
                            handleInstantAvatarSelect(art.url, art.title)
                          }
                          className={`group relative rounded-2xl overflow-hidden border-2 p-2 bg-neutral-900/60 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/20'
                              : 'border-neutral-800 hover:border-neutral-600'
                          }`}
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-950 mb-2">
                            <Image
                              src={art.url}
                              alt={art.title}
                              fill
                              unoptimized={art.url.endsWith('.svg')}
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="140px"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {art.title}
                          </p>
                          <p className="text-[10px] font-mono text-red-400">
                            Arte Oficial 3000×3000
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Studio Emblems */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    Emblemas Minimalistas de Estudio
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AVATAR_PRESETS.map((a) => {
                      const isSelected = liveAvatar === a.url
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            handleInstantAvatarSelect(a.url, a.name)
                          }
                          className={`group relative rounded-2xl overflow-hidden border-2 p-2 bg-neutral-900/60 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/20'
                              : 'border-neutral-800 hover:border-neutral-600'
                          }`}
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-950 mb-2">
                            <Image
                              src={a.url}
                              alt={a.name}
                              fill
                              unoptimized={a.url.endsWith('.svg')}
                              className="object-cover"
                              sizes="140px"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-white truncate">
                            {a.name}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BANNER (Unlocked Song Cover Arts + Studio Banners + Custom Upload) */}
            {activeTab === 'banner' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800">
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      Subir tu propio Banner / Portada Panorámica
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Sube una foto propia o usa con 1 clic las portadas de tus
                      canciones desbloqueadas.
                    </p>
                  </div>
                  <label
                    htmlFor="quick-banner-file-input"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Portada Propia</span>
                  </label>
                </div>

                {/* Unlocked Song Cover Arts as Banner */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5" /> Portadas de Canciones
                    Desbloqueadas (Clic para Usar como Banner)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {songCoverOptions.map((art) => {
                      const isSelected = liveBanner === art.url
                      return (
                        <button
                          key={art.id}
                          type="button"
                          onClick={() =>
                            handleInstantBannerSelect(art.url, art.title)
                          }
                          className={`group relative h-28 rounded-2xl overflow-hidden border-2 text-left transition-all hover:scale-[1.01] active:scale-98 cursor-pointer ${
                            isSelected
                              ? 'border-red-500 ring-2 ring-red-500/50 shadow-lg'
                              : 'border-neutral-800 hover:border-neutral-600'
                          }`}
                        >
                          <Image
                            src={art.url}
                            alt={art.title}
                            fill
                            unoptimized={art.url.endsWith('.svg')}
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="320px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end justify-between p-3">
                            <div>
                              <span className="text-[10px] font-mono uppercase text-red-400 font-bold block">
                                Arte de Canción
                              </span>
                              <span className="text-xs font-extrabold text-white">
                                {art.title}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="bg-red-600 text-white p-1 rounded-full shadow">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Studio Presets */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    Banners Arquitectónicos de Estudio
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BANNER_PRESETS.filter((b) => b.category !== 'official').map(
                      (b) => {
                        const isSelected = liveBanner === b.url
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() =>
                              handleInstantBannerSelect(b.url, b.name)
                            }
                            className={`relative h-24 rounded-2xl overflow-hidden border-2 text-left transition-all hover:scale-[1.01] cursor-pointer ${
                              isSelected
                                ? 'border-red-500 ring-2 ring-red-500/40'
                                : 'border-neutral-800 hover:border-neutral-600'
                            }`}
                          >
                            <Image
                              src={b.url}
                              alt={b.name}
                              fill
                              unoptimized={b.url.endsWith('.svg')}
                              className="object-cover"
                              sizes="240px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2.5">
                              <span className="text-[11px] font-bold text-white truncate">
                                {b.name}
                              </span>
                            </div>
                          </button>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STICKERS & VITRINA (Steam / Dota 2 Style) */}
            {activeTab === 'stickers' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      Tu Vitrina Activa ({equippedStickerObjects.length} / 4
                      Stickers Equipados)
                    </span>
                    <span className="text-[10px] font-mono text-red-400">
                      Se guardan con 1 clic
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {equippedStickerObjects.length === 0 ? (
                      <span className="text-xs text-neutral-500 italic">
                        Haz clic en cualquier sticker de abajo para equiparlo en
                        tu banner.
                      </span>
                    ) : (
                      equippedStickerObjects.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleInstantStickerToggle(st.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-gradient-to-r ${st.bgGradient} ${st.borderClass} ${st.textClass} text-xs font-mono font-bold cursor-pointer hover:opacity-80`}
                          title="Clic para quitar de la vitrina"
                        >
                          <span>{st.emoji}</span>
                          <span>{st.label}</span>
                          <X className="w-3 h-3 ml-1 opacity-70" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STICKER_PRESETS.map((sticker) => {
                    const isEquipped = liveStickers.includes(sticker.id)
                    return (
                      <button
                        key={sticker.id}
                        type="button"
                        onClick={() => handleInstantStickerToggle(sticker.id)}
                        className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer ${
                          isEquipped
                            ? 'border-red-500 bg-red-950/25 shadow-lg'
                            : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-12 h-12 rounded-2xl border bg-gradient-to-br ${sticker.bgGradient} ${sticker.borderClass} flex items-center justify-center text-2xl shrink-0 shadow-md`}
                          >
                            {sticker.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-white truncate">
                                {sticker.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                                {sticker.rarity}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {sticker.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isEquipped ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-mono font-bold">
                              <Check className="w-3 h-3" /> Equipado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                              Equipar
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: HIMNO MUSICAL (1-Click Song Selector) */}
            {activeTab === 'music' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">
                  Elige con un clic la canción insignia que sonará completa en
                  la cabecera de tu perfil:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {songsList.map((s) => {
                    const isSelected = liveSongId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleInstantSongSelect(s.id)}
                        className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-950/30 shadow-lg'
                            : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-neutral-800 shrink-0">
                            <Image
                              src={s.thumbnailUrl}
                              alt={s.title}
                              fill
                              unoptimized={s.thumbnailUrl.endsWith('.svg')}
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white truncate">
                              {s.title}
                            </p>
                            <p className="text-[10px] font-mono text-neutral-400 truncate">
                              {s.subtitle}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="bg-red-600 text-white p-1.5 rounded-full shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: IDENTIDAD, ESTADO & BIO */}
            {activeTab === 'identity' && (
              <form onSubmit={handleIdentitySave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-300">
                      Nombre Visible
                    </label>
                    <input
                      type="text"
                      value={liveName}
                      onChange={(e) => setLiveName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-300">
                      Usuario (@handle)
                    </label>
                    <input
                      type="text"
                      value={liveUsername}
                      onChange={(e) => setLiveUsername(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Estado Actual
                  </label>
                  <input
                    type="text"
                    value={liveStatus}
                    onChange={(e) => setLiveStatus(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Biografía
                  </label>
                  <textarea
                    rows={3}
                    value={liveBio}
                    onChange={(e) => setLiveBio(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-600 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-300">
                      Fecha de Cumpleaños
                    </label>
                    <input
                      type="date"
                      value={liveBirthday}
                      onChange={(e) => setLiveBirthday(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-300">
                      Género
                    </label>
                    <select
                      value={liveGender}
                      onChange={(e) =>
                        setLiveGender(
                          e.target.value as
                            | 'male'
                            | 'female'
                            | 'gender_neutral'
                            | 'unspecified'
                        )
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-red-600 cursor-pointer"
                    >
                      <option value="unspecified">No especificar</option>
                      <option value="male">Hombre ♂</option>
                      <option value="female">Mujer ♀</option>
                      <option value="gender_neutral">Género Neutro ⚥</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeCustomizer}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isQuickSaving}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-lg cursor-pointer"
                  >
                    Guardar Identidad
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </div>
  )
}
