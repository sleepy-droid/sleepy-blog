'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Users, Menu, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { useLanguage } from '@/lib/i18n'

type NavbarProps = {
  authDesktop?: ReactNode
  authMobile?: ReactNode
}

export function Navbar({ authDesktop, authMobile }: NavbarProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(pathname)

  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
  }
  
  const { totalItemsCount, setIsOpen: setCartOpen } = useCart()
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 15
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: t('nav_shop'), href: '/shop', icon: ShoppingBag, badge: 'NUEVO' },
    { label: t('nav_community'), href: '/community', icon: Users },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300 transform-gpu',
        isScrolled
          ? 'bg-neutral-950/85 backdrop-blur-xl border-b border-red-950/50 shadow-xl shadow-black/70 py-2'
          : 'bg-gradient-to-b from-neutral-950/95 via-neutral-950/60 to-transparent py-3.5'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Inicio sleepyred999"
            className="group relative flex items-center gap-3 transition-transform duration-200 active:scale-95 rounded-xl"
          >
            <div className="relative flex items-center justify-center rounded-xl overflow-hidden p-1 group-hover:drop-shadow-[0_0_16px_rgba(239,68,68,0.65)] transition-all">
              <Image
                src="/images/logos/PNG-04.png"
                alt="sleepyred999 logo"
                width={240}
                height={75}
                priority
                className="h-11 sm:h-13 md:h-15 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-md"
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1.5 rounded-full border border-neutral-800/80 backdrop-blur-md shadow-inner">
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
              {t('nav_home')}
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

          {/* Right Header Actions: Shopping Cart & Auth Profile Menu */}
          <div className="flex items-center gap-2.5">
            {/* Shopping Cart Button & Badge Counter */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
              title="Abrir Carrito de Compras"
            >
              <ShoppingBag className="w-4 h-4 text-red-400" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-950 shadow-md">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* Auth desktop (User Profile Menu on Hover or Guest Actions) */}
            {authDesktop}

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
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-red-950/40 bg-neutral-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3 mt-2 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
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

          {authMobile}
        </div>
      )}
    </header>
  )
}
