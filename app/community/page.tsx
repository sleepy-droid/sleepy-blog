'use client'

import { Users, MessageSquare, Flame, Bell } from 'lucide-react'

export default function CommunityPage() {
  const discussions = [
    {
      id: 1,
      author: "cyber_fan99",
      time: "Hace 2 horas",
      title: "¿Cuándo sale el próximo drop del álbum?",
      replies: 14,
      likes: 32,
      tag: "DISCUSIÓN",
    },
    {
      id: 2,
      author: "sleepy_team",
      time: "Ayer",
      title: "Reglas de la comunidad y espacio de debate en Discord",
      replies: 8,
      likes: 67,
      tag: "ANUNCIO",
    },
  ]

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <header className="border-b border-neutral-800 pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <Users className="w-3.5 h-3.5" />
          Espacio de la Comunidad
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Comunidad & Foro</h1>
        <p className="text-sm text-neutral-400">
          Conéctate con otros seguidores, comparte feedback y entérate de los próximos lanzamientos.
        </p>
      </header>

      <section className="space-y-4">
        {discussions.map((item) => (
          <article
            key={item.id}
            className="border border-neutral-800/80 rounded-xl p-5 space-y-3 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-900/50 px-2 py-0.5 rounded">
                  {item.tag}
                </span>
                <span className="text-xs text-neutral-400 font-mono">@{item.author}</span>
              </div>
              <span className="text-xs text-neutral-500">{item.time}</span>
            </div>

            <h2 className="text-base font-semibold text-white tracking-tight hover:text-red-400 cursor-pointer transition-colors">
              {item.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800/60">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                {item.replies} respuestas
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                {item.likes} reacciones
              </span>
            </div>
          </article>
        ))}
      </section>

      <div className="p-6 rounded-xl border border-red-950/50 bg-gradient-to-r from-red-950/30 to-neutral-900/40 text-center space-y-3">
        <Bell className="w-6 h-6 text-red-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">¿Quieres unirte al grupo exclusivo de Discord?</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Próximamente habilitaremos el acceso directo con Supabase Auth para miembros registrados.
        </p>
      </div>
    </main>
  )
}
