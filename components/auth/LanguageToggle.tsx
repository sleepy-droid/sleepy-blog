'use client'

import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()

  return (
    <div
      className={cn(
        'flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 px-2.5 py-1 rounded-full text-xs font-mono',
        className
      )}
    >
      <Globe className="w-3.5 h-3.5 text-red-500" />
      <button
        type="button"
        onClick={() => setLang('es')}
        className={cn(
          'px-1 transition-colors cursor-pointer',
          lang === 'es'
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-neutral-200'
        )}
      >
        ES
      </button>
      <span className="text-neutral-700 font-normal">|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'px-1 transition-colors cursor-pointer',
          lang === 'en'
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-neutral-200'
        )}
      >
        EN
      </button>
    </div>
  )
}
