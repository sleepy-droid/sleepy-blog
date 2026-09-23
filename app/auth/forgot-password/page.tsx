import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Recuperar contraseña | sleepyred999',
  description: 'Restablece el acceso a tu cuenta sleepyred999.',
}

export default function ForgotPasswordPage() {
  return (
    <main className="max-w-md mx-auto p-6 font-sans">
      <div className="border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 bg-neutral-900/50 backdrop-blur-md shadow-2xl shadow-red-950/20">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <KeyRound className="w-3.5 h-3.5" />
            Recuperación de cuenta
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-neutral-400">
            Ingresa tu email y te enviaremos un correo oficial de Supabase Auth para restablecer tu contraseña.
          </p>
        </header>

        <ForgotPasswordForm />

        <p className="text-center text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            ← Volver a la bitácora
          </Link>
        </p>
      </div>
    </main>
  )
}
