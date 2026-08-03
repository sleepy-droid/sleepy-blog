import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { LogIn } from 'lucide-react'

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const next = params.next && params.next.startsWith('/') ? params.next : '/'

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
