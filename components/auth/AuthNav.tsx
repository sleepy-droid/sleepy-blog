import Link from 'next/link'
import Image from 'next/image'
import { LogIn, UserPlus, LogOut, Shield, Library, User } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { logout } from '@/app/auth/actions'
import { UserMenu } from '@/components/auth/UserMenu'
import { LanguageToggle } from '@/components/auth/LanguageToggle'

/**
 * Botones y menú de auth del Navbar (Server Component).
 */
export async function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const user = await getCurrentUser()

  if (!user) {
    if (mobile) {
      return (
        <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-neutral-400 font-medium">Idioma de la web</span>
            <LanguageToggle />
          </div>
          <Link
            href="/auth/login"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-white"
          >
            <LogIn className="w-3.5 h-3.5 text-red-400" />
            Iniciar Sesión
          </Link>
          <Link
            href="/auth/register"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-700 to-red-600 rounded-lg shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Registrarse
          </Link>
        </div>
      )
    }

    return (
      <div className="hidden md:flex items-center gap-2.5">
        <LanguageToggle />
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700/60 transition-all duration-200"
        >
          <LogIn className="w-3.5 h-3.5 text-red-400" />
          Iniciar Sesión
        </Link>
        <Link
          href="/auth/register"
          className="relative group inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.35)] hover:shadow-[0_0_22px_rgba(220,38,38,0.6)] transition-all duration-300 active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5 text-red-200 group-hover:scale-110 transition-transform" />
          Registrarse
        </Link>
      </div>
    )
  }

  const name = user.profile?.display_name || user.email?.split('@')[0] || 'Miembro'
  const username = user.profile?.username
  const profileHref = username ? `/u/${username}` : '/profile'
  const avatarUrl = user.profile?.avatar_url
  const initial = name.charAt(0).toUpperCase() || 'U'

  if (mobile) {
    return (
      <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2.5">
        {/* Cabecera del usuario en móvil */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <span className="relative w-9 h-9 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="36px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-300">
                {initial}
              </span>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{name}</span>
              {user.isAdmin && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-300 bg-red-950 border border-red-900/60 px-1.5 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 truncate">
              {username ? `@${username}` : user.email}
            </p>
          </div>
        </div>

        {/* Enlaces de usuario */}
        <Link
          href={profileHref}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-900/80 border border-neutral-800 rounded-lg hover:text-white"
        >
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-red-400" />
            <span>Mi Perfil</span>
          </div>
          <span className="text-[10px] text-neutral-500">Configuración</span>
        </Link>

        <Link
          href="/library"
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-900/80 border border-neutral-800 rounded-lg hover:text-white"
        >
          <div className="flex items-center gap-2">
            <Library className="w-3.5 h-3.5 text-red-400" />
            <span>Mi Biblioteca</span>
          </div>
          <span className="text-[10px] text-neutral-500">Música y descargas</span>
        </Link>

        {user.isAdmin && (
          <Link
            href="/admin"
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg hover:bg-red-950/60"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-red-300" />
              <span>Panel de Administración</span>
            </div>
            <span className="text-[10px] text-red-400/80">Gestión global</span>
          </Link>
        )}

        {/* Perilla de idioma en móvil */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800/80">
          <span className="text-xs text-neutral-400 font-medium">Idioma / Language</span>
          <LanguageToggle />
        </div>

        {/* Cerrar sesión */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-400 hover:text-red-300 bg-neutral-900 border border-neutral-800 hover:border-red-900/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center">
      <UserMenu
        user={{
          id: user.id,
          email: user.email,
          name,
          username,
          avatarUrl,
          isAdmin: user.isAdmin,
        }}
      />
    </div>
  )
}
