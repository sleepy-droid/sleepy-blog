import Link from 'next/link'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Restablecer contraseña | sleepyred999',
  description: 'Ingresa tu nueva contraseña para tu cuenta sleepyred999.',
}

export default async function ResetPasswordPage() {
  const user = await getCurrentUser()

  return (
    <main className="max-w-md mx-auto p-6 font-sans">
      <div className="border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 bg-neutral-900/50 backdrop-blur-md shadow-2xl shadow-red-950/20">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Nueva contraseña
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Restablecer contraseña
          </h1>
          <p className="text-sm text-neutral-400">
            Define una contraseña segura para tu cuenta.
          </p>
        </header>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-5 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-950/90 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white">
                Enlace no válido o expirado
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Por motivos de seguridad, los enlaces de recuperación de cuenta caducan rápidamente. Por favor solicita un nuevo enlace.
              </p>
            </div>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-neutral-600">
          <Link href="/auth/login" className="hover:text-neutral-400 transition-colors">
            ← Volver a Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
