import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { Users, ArrowLeft, Shield, VolumeX, CheckCircle, Ban } from 'lucide-react'
import { toggleUserCommentPrivilege } from '../actions'
import type { Profile } from '@/lib/types'

export const metadata = {
  title: 'Gestión de Usuarios | Panel Admin sleepyred999',
}

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const profiles: Profile[] = dbProfiles || []

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-red-500" />
              Gestión de Usuarios & Moderación de Comentarios
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Modera privilegios de comentario para cuentas sospechosas de spam sin eliminar sus compras o accesos.
            </p>
          </div>
        </div>
      </header>

      <div className="border border-neutral-800/80 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono text-neutral-400 uppercase tracking-wider">
                <th className="p-4">Usuario</th>
                <th className="p-4">Correo</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Permiso de Comentario</th>
                <th className="p-4 text-right">Acciones de Moderación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {profiles.map((p) => {
                const displayName = p.display_name || p.username || 'Miembro'
                const canComment = p.can_comment !== false

                return (
                  <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          {p.avatar_url ? (
                            <Image src={p.avatar_url} alt={displayName} fill className="object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-red-400">{displayName.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block">@{displayName}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">ID: #{p.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-neutral-300">
                      {p.email || 'Oculto'}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        p.role === 'admin'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}>
                        {p.role === 'admin' ? '🛡️ Admin' : '👤 Usuario'}
                      </span>
                    </td>

                    <td className="p-4">
                      {canComment ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Habilitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          <Ban className="w-3 h-3" /> Restringido (Muted)
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <form action={toggleUserCommentPrivilege} className="inline-block">
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="can_comment" value={canComment ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            canComment
                              ? 'bg-amber-950 hover:bg-amber-900 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {canComment ? 'Restringir Comentarios' : 'Habilitar Comentarios'}
                        </button>
                      </form>

                      <Link
                        href={`/u/${p.username || p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs transition-colors"
                      >
                        <span>Perfil</span>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
