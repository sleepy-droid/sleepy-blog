import Link from 'next/link'
import { LogIn, UserPlus, LogOut, Shield, User } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { logout } from '@/app/auth/actions'

/**
 * Botones de auth del Navbar (Server Component).
 * Lee la sesión en el servidor → no hay flash de "no logueado" tan agresivo.
 */
export async function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const user = await getCurrentUser()

  if (!user) {
    if (mobile) {
      return (
        <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
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
      <div className="hidden md:flex items-center gap-3">
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

  if (mobile) {
    return (
      <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300">
          <User className="w-3.5 h-3.5 text-red-400" />
          <span className="font-medium text-white truncate">{name}</span>
          {user.isAdmin && (
            <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-red-300 bg-red-950 border border-red-900/60 px-1.5 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>
        {user.isAdmin && (
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg hover:bg-red-950/60"
          >
            <Shield className="w-3.5 h-3.5" />
            Panel Admin
          </Link>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            Cerrar sesión
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      {user.isAdmin && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-300 rounded-lg bg-red-950/50 border border-red-900/50 hover:bg-red-950/80 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </Link>
      )}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-300 max-w-[140px]">
        <User className="w-3.5 h-3.5 text-red-400 shrink-0" />
        <span className="truncate font-medium text-white">{name}</span>
      </span>
      <form action={logout}>
        <button
          type="submit"
          title="Cerrar sesión"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700/60 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Salir
        </button>
      </form>
    </div>
  )
}
