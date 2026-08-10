import Link from 'next/link'
import Image from 'next/image'
import { Camera, Share2, MessageSquare, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xl mt-16 py-10 font-sans text-neutral-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logos/PNG-04.png"
                alt="sleepyred999"
                width={180}
                height={55}
                className="h-10 w-auto object-contain filter drop-shadow-md"
              />
            </Link>
            <p className="text-xs text-neutral-500 max-w-sm">
              Bitácora oficial, diario, lanzamientos musicales directos y tienda exclusiva sleepyred999.
            </p>
          </div>

          {/* Social Links Footer Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://instagram.com/sleepyred999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
            >
              <Camera className="w-4 h-4 text-pink-500" />
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>

            <a
              href="https://x.com/SLEEPYRED999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>X (Twitter)</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>

            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Discord</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
        </div>

        {/* Links & Copyright */}
        <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-neutral-300 transition-colors">Inicio</Link>
            <Link href="/shop" className="hover:text-neutral-300 transition-colors">Tienda</Link>
            <Link href="/community" className="hover:text-neutral-300 transition-colors">Foro</Link>
            <Link href="/library" className="hover:text-neutral-300 transition-colors">Biblioteca</Link>
          </div>

          <div className="flex items-center gap-2 text-neutral-500 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span>© {new Date().getFullYear()} sleepyred999. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
