import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Consultar las entradas reales de Supabase
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="p-8 max-w-xl mx-auto">
        <div className="p-4 bg-red-900/30 text-red-400 border border-red-800 rounded">
          Error: {error.message}
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      <header className="border-b border-neutral-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">sleepy-blog</h1>
        <p className="text-sm text-neutral-400 mt-1">Bitácora oficial y lanzamientos directos</p>
      </header>

      <section className="space-y-6">
        {posts?.map((post) => (
          <article key={post.id} className="border border-neutral-800 rounded-lg p-5 space-y-4 bg-neutral-900/50">
            <div>
              <span className="text-xs text-neutral-500">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
              <h2 className="text-xl font-semibold mt-1">{post.title}</h2>
            </div>

            <p className="text-neutral-300 text-sm whitespace-pre-line">{post.content}</p>

            {post.track_preview_url && (
              <div className="pt-2">
                <audio controls src={post.track_preview_url} className="w-full h-10" />
              </div>
            )}

            {post.price > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                <span className="text-neutral-400">Sencillo WAV</span>
                <span className="font-mono bg-neutral-800 px-2 py-1 rounded">${post.price} USD</span>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}