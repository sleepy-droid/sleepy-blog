import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  return (
    <main className="max-w-md mx-auto p-6 font-sans">
      <div className="border border-neutral-800/80 rounded-2xl p-6 md:p-8 space-y-6 bg-neutral-900/50 backdrop-blur-md shadow-2xl shadow-red-950/20">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <UserPlus className="w-3.5 h-3.5" />
            Únete a la comunidad
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Crear cuenta</h1>
          <p className="text-sm text-neutral-400">
            Regístrate para comentar en la bitácora y ser parte del movimiento.
          </p>
        </header>

        <RegisterForm />

        <p className="text-center text-xs text-neutral-600">
          <Link href="/" className="hover:text-neutral-400 transition-colors">
            ← Volver a la bitácora
          </Link>
        </p>
      </div>
    </main>
  )
}
