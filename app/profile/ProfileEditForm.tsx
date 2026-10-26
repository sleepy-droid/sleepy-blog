'use client'

import { useState, useActionState } from 'react'
import Image from 'next/image'
import {
  Edit3,
  Loader2,
  Check,
  Music,
  ImageIcon,
  User,
  Upload,
} from 'lucide-react'
import { updateProfile, type ProfileActionState } from './actions'
import {
  BANNER_PRESETS,
  AVATAR_PRESETS,
  SONG_PRESETS,
  type SongPreset,
} from '@/lib/profile-presets'
import type { Profile } from '@/lib/types'

type ProfileEditFormProps = {
  profile: Profile | null
  availableSongs?: SongPreset[]
}

const initialState: ProfileActionState = {}

export function ProfileEditForm({ profile, availableSongs }: ProfileEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, pending] = useActionState(updateProfile, initialState)

  const songsList = availableSongs && availableSongs.length > 0 ? availableSongs : SONG_PRESETS

  const [selectedBanner, setSelectedBanner] = useState(
    profile?.banner_url || BANNER_PRESETS[0].url
  )
  const [selectedAvatar, setSelectedAvatar] = useState(
    profile?.avatar_url || AVATAR_PRESETS[0].url
  )
  const [selectedSong, setSelectedSong] = useState(
    profile?.favorite_product_id || songsList[0].id
  )
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null)
  const [bannerFileName, setBannerFileName] = useState<string | null>(null)

  if (!isOpen) {
    return (
      <div className="space-y-2">
        {state?.success && (
          <div className="p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{state.success}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white hover:border-red-900/50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Edit3 className="w-3.5 h-3.5 text-red-400" />
          <span>Personalizar Perfil (Banner, Foto CDN, Canción Favorita, Bio)</span>
        </button>
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData)
        setIsOpen(false)
      }}
      className="space-y-4 pt-3 border-t border-neutral-800 animate-in fade-in duration-200"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">
            Nombre Visible
          </label>
          <input
            type="text"
            name="display_name"
            defaultValue={profile?.display_name || ''}
            placeholder="Tu nombre..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-600 font-sans"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">
            Nombre de Usuario (@handle)
          </label>
          <input
            type="text"
            name="username"
            defaultValue={profile?.username || ''}
            placeholder="sleepy_member"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-neutral-300">
          Status Update Actual
        </label>
        <input
          type="text"
          name="status_update"
          defaultValue={profile?.status_update || ''}
          placeholder="Ej: En el estudio escuchando el nuevo drop en WAV..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-600 font-sans"
        />
      </div>

      {/* Selector de Canción Favorita */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Music className="w-4 h-4 text-red-400" />
          <span>Canción Favorita (Snippet de 30s en tu perfil)</span>
        </div>
        <p className="text-[10px] text-neutral-400">
          Esta canción se destacará en la parte superior de tu perfil con reproductor de audio.
        </p>

        <select
          name="favorite_product_id"
          value={selectedSong}
          onChange={(e) => setSelectedSong(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-600 font-sans cursor-pointer"
        >
          {songsList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} — {s.subtitle}
            </option>
          ))}
        </select>
      </div>

      {/* Selector Visual de Banners + Subida Directa CDN */}
      <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ImageIcon className="w-4 h-4 text-red-400" />
            <span>Banner de Cabecera (Presets de Estudio o Subida Propia)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BANNER_PRESETS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBanner(b.url)
                setBannerFileName(null)
              }}
              className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                selectedBanner === b.url && !bannerFileName
                  ? 'border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)] ring-1 ring-red-500'
                  : 'border-neutral-800 hover:border-neutral-700 opacity-75 hover:opacity-100'
              }`}
            >
              <Image
                src={b.url}
                alt={b.name}
                fill
                unoptimized={b.url.endsWith('.svg')}
                className="object-cover"
                sizes="160px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[10px] font-bold text-white truncate drop-shadow">
                  {b.name}
                </span>
              </div>
              {selectedBanner === b.url && !bannerFileName && (
                <span className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-1 space-y-2">
          <label className="block text-[10px] text-neutral-300 font-semibold flex items-center gap-1.5">
            <Upload className="w-3 h-3 text-red-400" />
            <span>Subir tu propio Banner al CDN (JPG, PNG, WebP, SVG):</span>
          </label>
          <input
            type="file"
            name="banner_file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setBannerFileName(f ? f.name : null)
            }}
            className="block w-full text-xs text-neutral-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
          />
          <input type="hidden" name="banner_url" value={selectedBanner} />
        </div>
      </div>

      {/* Selector Visual de Avatares + Subida Directa CDN */}
      <div className="space-y-2.5 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <User className="w-4 h-4 text-red-400" />
          <span>Foto de Perfil (Insignias Minimalistas o Subida Propia)</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setSelectedAvatar(a.url)
                setAvatarFileName(null)
              }}
              title={a.name}
              className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedAvatar === a.url && !avatarFileName
                  ? 'border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)] ring-2 ring-red-500'
                  : 'border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={a.url}
                alt={a.name}
                fill
                unoptimized={a.url.endsWith('.svg')}
                className="object-cover"
                sizes="56px"
              />
              {selectedAvatar === a.url && !avatarFileName && (
                <span className="absolute inset-0 bg-red-600/25 flex items-center justify-center text-white">
                  <Check className="w-4 h-4 drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-1 space-y-2">
          <label className="block text-[10px] text-neutral-300 font-semibold flex items-center gap-1.5">
            <Upload className="w-3 h-3 text-red-400" />
            <span>Subir tu propia Foto de Perfil al CDN:</span>
          </label>
          <input
            type="file"
            name="avatar_file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setAvatarFileName(f ? f.name : null)
            }}
            className="block w-full text-xs text-neutral-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
          />
          <input type="hidden" name="avatar_url" value={selectedAvatar} />
        </div>
      </div>

      {/* Biografía */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-neutral-300">
          Biografía / Presentación
        </label>
        <textarea
          name="bio"
          defaultValue={profile?.bio || ''}
          rows={2}
          placeholder="Cuéntale a la comunidad sobre tus proyectos o música favorita..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-600 font-sans resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">
            Fecha de Cumpleaños
          </label>
          <input
            type="date"
            name="birthday"
            defaultValue={profile?.birthday || ''}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">Género</label>
          <select
            name="gender"
            defaultValue={profile?.gender || 'unspecified'}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-sans"
          >
            <option value="unspecified">No especificar</option>
            <option value="male">Hombre ♂</option>
            <option value="female">Mujer ♀</option>
            <option value="gender_neutral">Género Neutro ⚥</option>
          </select>
        </div>
      </div>

      {state?.error && <p className="text-[11px] text-red-400 font-medium">{state.error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar y Sincronizar CDN'}
        </button>
      </div>
    </form>
  )
}
