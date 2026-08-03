'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Publicaciones', icon: FileText },
  { href: '/admin/comments', label: 'Comentarios', icon: MessageSquare },
]

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-56 shrink-0 space-y-4">
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 space-y-1">
        <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wide">
          <Shield className="w-3.5 h-3.5" />
          Panel Admin
        </div>
        <p className="text-sm font-medium text-white truncate">{adminName}</p>
      </div>

      <nav className="flex md:flex-col gap-1 overflow-x-auto">
        {links.map((link) => {
          const Icon = link.icon
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                active
                  ? 'bg-red-950/70 text-white border border-red-900/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al sitio
      </Link>
    </aside>
  )
}
