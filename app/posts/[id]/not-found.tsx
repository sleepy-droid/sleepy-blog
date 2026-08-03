/**
 * Custom Not-Found page for missing posts in sleepyred999 storefront.
 * URL Route Target: /posts/[id] when notFound() is triggered.
 * File Path: app/posts/[id]/not-found.tsx
 * 
 * Dependencies & Purpose:
 * 1. 'next/link': Provides a way for users to safely return to the home feed ('/').
 * 2. 'lucide-react': Uses the ArrowLeft icon for intuitive navigation.
 */

import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

export default function PostNotFound() {
  return (
    <main className="max-w-xl mx-auto p-6 min-h-[60vh] flex flex-col items-center justify-center text-center font-sans">
      <div className="border border-neutral-800 rounded-2xl p-8 bg-neutral-900/40 backdrop-blur-md space-y-5 w-full">
        <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-900/40 flex items-center justify-center mx-auto text-red-500">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Publicación no encontrada</h1>
          <p className="text-sm text-neutral-400">
            La entrada de la bitácora que buscas no existe o ha sido eliminada.
          </p>
        </div>

        <div className="pt-2">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-red-950/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar a la bitácora principal</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
