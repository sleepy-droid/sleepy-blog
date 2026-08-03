'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react'

export default function ShopPage() {
  const products = [
    {
      id: 'criss-angel-digital',
      name: 'Criss Angel (Edición Limitada)',
      category: 'Audio & Digital Release',
      price: '$12.00 USD',
      image: '/images/releases/criss-angel.jpg',
      badge: 'POPULAR',
      description: 'Lanzamiento digital exclusivo en alta calidad WAV + PDF de arte lírico.',
    },
    {
      id: 'sleepyred-hoodie-neon',
      name: 'Sleepyred Neon Hoodie (Over-size)',
      category: 'Merchandising Oficial',
      price: '$55.00 USD',
      image: '/images/logos/SLEEPYRED JPG NEON-02.jpg',
      badge: 'PRÓXIMAMENTE',
      description: 'Buzo negro pesado con estampado neón reflectivo de la marca.',
    },
  ]

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8 font-sans">
      <header className="border-b border-neutral-800 pb-5 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <ShoppingBag className="w-3.5 h-3.5" />
          Tienda Oficial & Drops
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Catálogo de Productos</h1>
        <p className="text-sm text-neutral-400">
          Consigue ediciones digitales directas, merchandising exclusivo y producciones originales.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {products.map((product) => (
          <article
            key={product.id}
            className="group border border-neutral-800/80 rounded-xl p-5 space-y-4 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-4">
              {/* 
                IMAGEN DE PRODUCTO OPTIMIZADA:
                - Dimensiones de la imagen gestionadas por Next.js Image con formato AVIF/WebP automático.
                - scale-105 asistido por hardware (transform-gpu) para movimientos suaves sin caída de FPS.
              */}
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-800/80 bg-neutral-950">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                />
                <span className="absolute top-3 right-3 text-[10px] uppercase font-bold text-red-300 bg-red-950/90 border border-red-800/60 px-2.5 py-1 rounded-md backdrop-blur-md">
                  {product.badge}
                </span>
              </div>

              <div>
                <span className="text-xs text-neutral-500 font-mono">{product.category}</span>
                <h2 className="text-lg font-semibold text-white tracking-tight group-hover:text-red-400 transition-colors mt-0.5">
                  {product.name}
                </h2>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between mt-4">
              <span className="text-base font-bold font-mono text-red-400">{product.price}</span>
              <button
                onClick={() => alert('Integración de checkout en desarrollo')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-800 hover:bg-red-700 rounded-lg border border-red-700/50 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Comprar
              </button>
            </div>
          </article>
        ))}
      </section>

      <footer className="p-4 rounded-xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-neutral-400" />
        Pagos seguros garantizados. Envíos y entregas digitales inmediatas.
      </footer>
    </main>
  )
}
