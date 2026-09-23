'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset, type AuthActionState } from '@/app/auth/actions'

const initialState: AuthActionState = {}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  )

  if (state?.success) {
    return (
      <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-xl border border-red-900/50 bg-neutral-950/90 p-5 text-center space-y-3 shadow-lg shadow-red-950/30">
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Revisa tu correo</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {state.success}
            </p>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono pt-2 border-t border-neutral-800/80">
            Si no lo ves en tu bandeja principal, recuerda revisar la carpeta de spam o correo no deseado.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-medium text-neutral-300">
          Correo electrónico registrado
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 pl-9 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-300 animate-in fade-in"
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
          <Mail className="w-4 h-4" />
        )}
        {pending ? 'Enviando enlace…' : 'Enviar enlace de recuperación'}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a iniciar sesión
        </Link>
      </div>
    </form>
  )
}
