'use client'

import { useActionState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'
import { updatePassword, type AuthActionState } from '@/app/auth/actions'
import { PasswordInput } from '@/components/auth/PasswordInput'

const initialState: AuthActionState = {}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <PasswordInput
        id="password"
        name="password"
        label="Nueva contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Mínimo 8 caracteres"
      />

      <PasswordInput
        id="confirm_password"
        name="confirm_password"
        label="Confirmar nueva contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Repite la contraseña"
      />

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
          <KeyRound className="w-4 h-4" />
        )}
        {pending ? 'Actualizando contraseña…' : 'Establecer nueva contraseña'}
      </button>
    </form>
  )
}
