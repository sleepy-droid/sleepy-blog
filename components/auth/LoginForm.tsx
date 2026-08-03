'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { LogIn, Loader2 } from 'lucide-react'
import { login, type AuthActionState } from '@/app/auth/actions'

const initialState: AuthActionState = {}

type LoginFormProps = {
  next?: string
}

export function LoginForm({ next = '/' }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

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
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="••••••••"
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
          <LogIn className="w-4 h-4" />
        )}
        {pending ? 'Entrando…' : 'Iniciar sesión'}
      </button>

      <p className="text-center text-xs text-neutral-500 pt-1">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" className="text-red-400 hover:text-red-300 font-medium">
          Regístrate
        </Link>
      </p>
    </form>
  )
}
