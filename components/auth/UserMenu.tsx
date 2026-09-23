'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Library,
  Shield,
  LogOut,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import { logout } from '@/app/auth/actions'

export type UserMenuProps = {
  user: {
    id: string
    email: string | null
    name: string
    username?: string | null
    avatarUrl?: string | null
    isAdmin: boolean
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { lang, setLang } = useLanguage()

  const initial = user.name.charAt(0).toUpperCase() || 'U'
  const profileHref = user.username ? `/u/${user.username}` : '/profile'

  // Hover handlers con pequeño delay para que la transición sea fluida
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 220)
  }

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {/* Botón Trigger / Perfil */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Abrir menú de perfil"
        className={cn(
          'group flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-neutral-900/90 border transition-all duration-200 cursor-pointer shadow-sm',
          isOpen
            ? 'border-red-600/70 bg-neutral-900 shadow-[0_0_14px_rgba(220,38,38,0.35)]'
            : 'border-neutral-800/80 hover:border-red-900/60 hover:bg-neutral-800/60'
        )}
      >
        <span className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0 ring-1 ring-red-950/40 group-hover:ring-red-600/60 transition-all">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name}
              fill
              className="object-cover"
              sizes="28px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-red-300">
              {initial}
            </span>
          )}
        </span>

        <span className="max-w-[100px] truncate text-xs font-medium text-white group-hover:text-red-200 transition-colors">
          {user.name}
        </span>

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-red-400'
          )}
        />
      </button>

      {/* Puente invisible para evitar que el hover se rompa entre el botón y el menú */}
      {isOpen && (
        <div className="absolute right-0 top-full h-2 w-full" aria-hidden="true" />
      )}

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-red-950/60 bg-neutral-950/95 p-2 backdrop-blur-2xl shadow-2xl shadow-black/90 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Cabecera del Usuario */}
          <div className="p-3 rounded-xl bg-gradient-to-b from-neutral-900/80 to-neutral-900/40 border border-neutral-800/80 mb-1.5">
            <div className="flex items-center gap-3">
              <span className="relative w-10 h-10 rounded-full overflow-hidden border border-red-800/60 bg-neutral-950 shrink-0 shadow-md">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-red-300">
                    {initial}
                  </span>
                )}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  {user.isAdmin && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-red-300 bg-red-950/90 border border-red-800/60 px-1.5 py-0.2 rounded shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {user.username ? `@${user.username}` : user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Enlaces Únicos del Usuario */}
          <div className="space-y-0.5 py-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800/80 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-red-900/60 group-hover:bg-red-950/30 transition-colors">
                <User className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="flex flex-col">
                <span>Mi Perfil</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Configuración y cuenta
                </span>
              </div>
            </Link>

            <Link
              href="/library"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800/80 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-red-900/60 group-hover:bg-red-950/30 transition-colors">
                <Library className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="flex flex-col">
                <span>Mi Biblioteca</span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  Música, descargas y compras
                </span>
              </div>
            </Link>

            {user.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-200 hover:text-white bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-800/70 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-950 border border-red-800/60 flex items-center justify-center shadow-inner">
                  <Shield className="w-3.5 h-3.5 text-red-300" />
                </div>
                <div className="flex flex-col">
                  <span>Panel de Administración</span>
                  <span className="text-[10px] text-red-400/80 font-normal">
                    Gestión de blog, tienda y órdenes
                  </span>
                </div>
              </Link>
            )}
          </div>

          <div className="h-px bg-neutral-800/80 my-1.5" />

          {/* Perilla de Idioma (ES / EN) */}
          <div className="px-3 py-2 rounded-xl bg-neutral-900/50 border border-neutral-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-medium text-neutral-300">Idioma</span>
            </div>

            <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setLang('es')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all font-bold cursor-pointer',
                  lang === 'es'
                    ? 'bg-red-700 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all font-bold cursor-pointer',
                  lang === 'en'
                    ? 'bg-red-700 text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                EN
              </button>
            </div>
          </div>

          <div className="h-px bg-neutral-800/80 my-1.5" />

          {/* Acción de Cerrar Sesión */}
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all cursor-pointer group"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-400 transition-colors" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
