'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { LogIn, Loader2, UserPlus } from 'lucide-react'
import { login, type AuthActionState } from '@/app/auth/actions'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useLanguage } from '@/lib/i18n'

const initialState: AuthActionState = {}

type LoginFormProps = {
  next?: string
}

export function LoginForm({ next = '/' }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState)
  const { t } = useLanguage()

  const registerHref =
    next && next !== '/' ? `/auth/register?next=${encodeURIComponent(next)}` : '/auth/register'

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <label htmlFor="identifier" className="block text-xs font-medium text-neutral-300">
          Email o Nombre de Usuario
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="tu@email.com o tu usuario"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        labelAction={
          <Link
            href="/auth/forgot-password"
            className="text-[11px] font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        }
      />

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
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-700 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] transition-all hover:from-red-600 hover:to-red-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        {pending ? 'Entrando…' : t('login_title')}
      </button>

      {/* Prompt claro de registro dentro de la página de login */}
      <div className="pt-3 border-t border-neutral-800/80">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span className="text-neutral-400">{t('login_no_account')}</span>
          <Link
            href={registerHref}
            className="inline-flex items-center gap-1.5 font-bold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('login_register_cta')}</span>
          </Link>
        </div>
      </div>
    </form>
  )
}
