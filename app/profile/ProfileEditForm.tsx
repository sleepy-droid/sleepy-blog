'use client'

import { useState, useActionState, useEffect } from 'react'
import { Edit3, Sparkles, Loader2, Check } from 'lucide-react'
import { updateProfile, type ProfileActionState } from './actions'
import type { Profile } from '@/lib/types'

type ProfileEditFormProps = {
  profile: Profile | null
}

const initialState: ProfileActionState = {}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, pending] = useActionState(updateProfile, initialState)

  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
    }
  }, [state?.success])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white hover:border-red-900/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5 text-red-400" />
        <span>Personalizar Perfil (Foto, Banner, Status, Cumpleaños)</span>
      </button>
    )
  }

  return (
    <form action={formAction} className="space-y-3 pt-2 border-t border-neutral-800 animate-in fade-in duration-200">
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-neutral-300">Nombre Visible</label>
        <input
          type="text"
          name="display_name"
          defaultValue={profile?.display_name || ''}
          placeholder="Tu nombre..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-neutral-300">Status Update Actual</label>
        <input
          type="text"
          name="status_update"
          defaultValue={profile?.status_update || ''}
          placeholder="Ej: Escuchando la nueva canción en bucle..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">Fecha de Cumpleaños</label>
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

      <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-neutral-300">Biografía / Mensaje</label>
        <textarea
          name="bio"
          defaultValue={profile?.bio || ''}
          rows={2}
          placeholder="Cuéntale a la comunidad sobre ti..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-sans resize-y"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">URL Foto de Perfil</label>
          <input
            type="url"
            name="avatar_url"
            defaultValue={profile?.avatar_url || ''}
            placeholder="https://..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-neutral-300">URL Foto de Banner</label>
          <input
            type="url"
            name="banner_url"
            defaultValue={profile?.banner_url || ''}
            placeholder="https://..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>
      </div>

      {state?.error && <p className="text-[11px] text-red-400">{state.error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors disabled:opacity-60 cursor-pointer"
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
