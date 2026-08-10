import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { AdminCommentList } from './AdminCommentList'
import type { CommentWithAuthor } from '@/lib/types'

export const metadata = {
  title: 'Moderación de Comentarios | Panel Admin sleepyred999',
}

export default async function AdminCommentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbComments } = await supabase
    .from('comments')
    .select('*, profiles:user_id (display_name, email, avatar_url, username)')
    .order('created_at', { ascending: false })

  const comments: CommentWithAuthor[] = dbComments || []

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-red-500" />
              Moderación de Comentarios por Categoría
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Filtra y modera comentarios divididos entre Publicaciones, Productos y Foro de la Comunidad.
            </p>
          </div>
        </div>
      </header>

      {/* Admin Comment List split into 3 categories */}
      <AdminCommentList comments={comments} />
    </main>
  )
}
