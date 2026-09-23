import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { LogIn, CheckCircle2, AlertCircle } from 'lucide-react'

type LoginPageProps = {
  searchParams: Promise<{ next?: string; updated?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const next = params.next && params.next.startsWith('/') ? params.next : '/'
  const isUpdated = params.updated === 'true'
  const isRecoveryFailed = params.error === 'recovery_failed'

  return (
    <main className="max-w-md mx-auto p-6 font-sans">
      <div className="border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 bg-neutral-900/50 backdrop-blur-md shadow-2xl shadow-red-950/20">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <LogIn className="w-3.5 h-3.5" />
            Acceso de miembros
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Iniciar sesión</h1>
          <p className="text-sm text-neutral-400">
            Entra para comentar y acceder a tu espacio sleepyred999.
          </p>
        </header>

        {isUpdated && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-800/60 bg-emerald-950/30 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              ¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tus nuevas credenciales.
            </span>
          </div>
        )}

        {isRecoveryFailed && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-red-900/60 bg-red-950/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              El enlace de recuperación no es válido o ha expirado. Por favor{' '}
              <Link href="/auth/forgot-password" className="underline font-semibold hover:text-white">
                solicita uno nuevo
              </Link>
              .
            </span>
          </div>
        )}

        <LoginForm next={next} />

        <p className="text-center text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            ← Volver a la bitácora
          </Link>
        </p>
      </div>
    </main>
  )
}
