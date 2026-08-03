'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { UserPlus, Loader2 } from 'lucide-react'
import { register, type AuthActionState } from '@/app/auth/actions'

const initialState: AuthActionState = {}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState)

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          {state.success}
        </div>
        <Link
          href="/auth/login"
          className="inline-flex text-xs font-medium text-red-400 hover:text-red-300"
        >
          Ir a iniciar sesión →
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="display_name" className="block text-xs font-medium text-neutral-300">
          Nombre de usuario
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          autoComplete="nickname"
          required
          minLength={2}
          maxLength={40}
          placeholder="sleepy_fan"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium text-neutral-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@email.com"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-xs font-medium text-neutral-300">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm_password" className="block text-xs font-medium text-neutral-300">
          Confirmar contraseña
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repite la contraseña"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300"
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-700 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] transition-all hover:from-red-600 hover:to-red-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="text-center text-xs text-neutral-500 pt-1">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-red-400 hover:text-red-300 font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
