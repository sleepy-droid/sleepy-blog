/**
 * Dynamic Single Product Page for sleepyred999 storefront.
 * URL Route: /shop/[id]
 * File Path: app/shop/[id]/page.tsx
 * 
 * Features implemented according to prompt requirements:
 * 1. Next.js 16 App Router dynamic async params (`Promise<{ id: string }>`).
 * 2. Amazon-like viewer: High-res artwork with hardware-accelerated zoom effect (`transform-gpu`).
 * 3. SoundCloud-like audio player: Play/Pause preview, progress timeline, duration visualizer.
 * 4. Technical Specs & Variants: Size selector for physical merch (S/M/L/XL) vs Audio format specs for digital releases.
 * 5. Purchase & Library actions ("Comprar Ahora" / "Añadir a la Biblioteca").
 * 6. "Más productos como este" (Recommended products carousel/grid).
 * 7. Language Switcher UI placeholder (ES / EN toggle ready).
 * 8. Polymorphic comment system (`target_type = 'product'`).
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { CommentList } from '@/components/comments/CommentList'
import { formatPrice, type Product, type CommentWithAuthor } from '@/lib/types'
import { SingleProductClient } from './SingleProductClient'
import { getProductFolderStats } from '@/lib/product-files'
import { ArrowLeft, Tag, ShieldCheck, Sparkles, Globe, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Dynamic Metadata for SEO & OpenGraph */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const isUUID = UUID_REGEX.test(id)
  let query = supabase.from('products').select('*')
  if (isUUID) {
    query = query.or(`id.eq.${id},slug.eq.${id}`)
  } else {
    query = query.eq('slug', id)
  }

  const { data: product } = await query.maybeSingle()

  if (!product) {
    return { title: 'Producto no encontrado | sleepyred999' }
  }

  return {
    title: `${product.name} | sleepyred999 Store`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.thumbnail_url ? [product.thumbnail_url] : [],
    }
  }
}

export default async function SingleProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch Product from Supabase
  const isUUID = UUID_REGEX.test(id)
  let query = supabase.from('products').select('*')
  if (isUUID) {
    query = query.or(`id.eq.${id},slug.eq.${id}`)
  } else {
    query = query.eq('slug', id)
  }

  const { data: dbProduct } = await query.maybeSingle()

  if (!dbProduct) {
    notFound()
  }

  // Calculate live dynamic folder stats from public/songs/ or public/merch/
  const folderStats = getProductFolderStats(dbProduct)
  const product: Product = {
    ...dbProduct,
    folder_stats: folderStats,
  }

  // 2. Fetch User session
  const currentUser = await getCurrentUser()

  // 3. Fetch Comments for this product (target_type = 'product')
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles:user_id (display_name, email, avatar_url, username)')
    .or(`target_id.eq.${product.id},post_id.eq.${product.id}`)
    .order('created_at', { ascending: false })

  const comments = (commentsData ?? []) as CommentWithAuthor[]

  // 4. Fetch Recommended / "More like this" products
  const { data: relatedDb } = await supabase
    .from('products')
    .select('*')
    .neq('id', product.id)
    .eq('is_published', true)
    .limit(3)

  const relatedProducts: Product[] = relatedDb ?? []

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 font-sans">
      {/* Top Header Controls: Back Button & Language Selector Placeholder */}
      <nav className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Catálogo de Productos</span>
        </Link>

        {/* Language Selector UI Framework Placeholder */}
        <div className="flex items-center gap-2 text-xs font-mono bg-neutral-900/80 border border-neutral-800 px-3 py-1 rounded-full text-neutral-400">
          <Globe className="w-3.5 h-3.5 text-red-500" />
          <span className="text-white font-bold">ES</span>
          <span className="text-neutral-600">|</span>
          <span className="hover:text-white cursor-pointer transition-colors" title="Cambiar a Inglés (Próximamente)">EN</span>
        </div>
      </nav>

      {/* Main Single Product Display: Interactive Client View */}
      <article className="border border-neutral-800/90 rounded-3xl p-6 md:p-10 bg-neutral-900/40 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-10">
        <SingleProductClient product={product} />
      </article>

      {/* Recommended Section: "Más como esto" / "You'd also like" */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h2 className="text-xl font-bold tracking-tight text-white">También te podría gustar</h2>
            </div>
            <Link href="/shop" className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1">
              Ver todo el catálogo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel.id}
                href={`/shop/${rel.slug || rel.id}`}
                className="group border border-neutral-800/80 rounded-2xl p-4 bg-neutral-900/30 hover:border-red-900/50 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80">
                    {rel.thumbnail_url ? (
                      <Image
                        src={rel.thumbnail_url}
                        alt={rel.name}
                        fill
                        sizes="350px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">Sin portada</div>
                    )}
                    <span className="absolute top-2.5 right-2.5 text-[10px] uppercase font-bold text-red-300 bg-red-950/90 border border-red-900/60 px-2 py-0.5 rounded-md">
                      {rel.category === 'music' ? 'Música' : rel.fulfillment}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                      {rel.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between mt-4 text-xs font-mono">
                  <span className="font-bold text-red-400">{formatPrice(rel.price_cents, rel.currency)}</span>
                  <span className="text-neutral-400 group-hover:text-white transition-colors">Ver detalle →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Polymorphic Comments Section for Products */}
      <CommentList
        targetType="product"
        targetId={product.id}
        comments={comments}
        currentUser={currentUser}
      />
    </main>
  )
}
