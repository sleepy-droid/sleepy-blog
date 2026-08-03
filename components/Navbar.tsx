'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Users, Menu, X, LogIn, UserPlus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Track window scroll position for dynamic glassmorphic state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation link configuration
  const navItems = [
    { label: 'Shop', href: '/shop', icon: ShoppingBag, badge: 'NUEVO' },
    { label: 'Comunidad', href: '/community', icon: Users },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-neutral-950/80 backdrop-blur-xl border-b border-red-950/40 shadow-xl shadow-black/60 py-2.5'
          : 'bg-gradient-to-b from-neutral-950/90 via-neutral-950/50 to-transparent py-4'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* LEFT: Homepage Button with PNG-04 Logo */}
          <Link
            href="/"
            aria-label="Inicio sleepyred999"
            className="group relative flex items-center gap-3 transition-transform duration-200 active:scale-95"
          >
            <div className="relative flex items-center justify-center rounded-xl overflow-hidden p-1 group-hover:drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-all">
              <Image
                src="/images/logos/PNG-04.png"
                alt="sleepyred999 logo"
                width={130}
                height={40}
                priority
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* CENTER / NAVIGATION LINKS (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1.5 rounded-full border border-neutral-800/80 backdrop-blur-md shadow-inner">
            {/* Logo / Home indicator */}
            <Link
              href="/"
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                pathname === '/'
                  ? 'bg-red-950/80 text-white border border-red-800/50 shadow-[0_0_12px_rgba(220,38,38,0.25)] font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              Inicio
            </Link>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                    isActive
                      ? 'bg-red-950/80 text-white border border-red-800/50 shadow-[0_0_12px_rgba(220,38,38,0.25)] font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-red-400' : 'text-neutral-400')} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 text-[9px] font-bold text-red-400 bg-red-950/90 border border-red-900/60 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* RIGHT: AUTH ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => alert('Sistema de Login en desarrollo')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700/60 transition-all duration-200 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-red-400" />
              Iniciar Sesión
            </button>

            <button
              onClick={() => alert('Sistema de Registro en desarrollo')}
              className="relative group inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.35)] hover:shadow-[0_0_22px_rgba(220,38,38,0.6)] transition-all duration-300 active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-red-200 group-hover:scale-110 transition-transform" />
              Registrarse
            </button>
          </div>

          {/* MOBILE MENU TOGGLE BUTTON */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú de navegación"
              className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-red-950/40 bg-neutral-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3 mt-2 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === '/'
                  ? 'bg-red-950/60 text-white border border-red-900/40 font-semibold'
                  : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
              )}
            >
              <Sparkles className="w-4 h-4 text-red-500" />
              Inicio
            </Link>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-red-950/60 text-white border border-red-900/40 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-red-400" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-950 border border-red-900/60 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                alert('Sistema de Login en desarrollo')
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 rounded-lg hover:text-white cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-red-400" />
              Iniciar Sesión
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false)
                alert('Sistema de Registro en desarrollo')
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-700 to-red-600 rounded-lg shadow-md cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrarse
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
