'use client'

import Link from 'next/link'
import { Heart, X, LogIn, UserPlus, ShieldAlert } from 'lucide-react'

type GuestLoginModalProps = {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
  title?: string
  message?: string
}

export function GuestLoginModal({
  isOpen,
  onClose,
  redirectPath = '/',
  title = '¿Te gusta este contenido?',
  message = 'Para registrar tu voto y apoyar al artista, debes iniciar sesión o crear una cuenta gratuita.'
}: GuestLoginModalProps) {
  if (!isOpen) return null

  const encodedNext = encodeURIComponent(redirectPath)

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-red-950/90 border border-red-800/80 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/50">
          <Heart className="w-7 h-7 fill-current animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href={`/auth/login?next=${encodedNext}`}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-red-700 hover:bg-red-600 active:scale-98 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión para Votar</span>
          </Link>

          <Link
            href={`/auth/register?next=${encodedNext}`}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-300 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-red-400" />
            <span>Crear Cuenta Nueva</span>
          </Link>
        </div>

        <p className="text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-800/60">
          Los votos de usuarios reales impulsan el posicionamiento de los lanzamientos.
        </p>
      </div>
    </div>
  )
}
