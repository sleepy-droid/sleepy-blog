'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'es' | 'en'

type i18nContextType = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    nav_home: 'Inicio',
    nav_shop: 'Tienda',
    nav_community: 'Foro',
    nav_player: 'Reproductor',
    nav_library: 'Biblioteca',
    nav_orders: 'Mis Pedidos',
    nav_profile: 'Mi Perfil',
    nav_admin: 'Panel Admin',
    nav_login: 'Iniciar Sesión',
    nav_register: 'Registrarse',
    nav_new_badge: 'NUEVO',
    cart_title: 'Carrito de Compras',
    cart_empty: 'Tu carrito está vacío',
    cart_checkout: 'Proceder al Pago',
    add_to_cart: 'Añadir al Carrito',
    buy_now: 'Comprar Ahora',
    back_to_shop: 'Volver al Catálogo de Productos',
    back_to_blog: 'Volver a la bitácora',
    more_like_this: 'También te podría gustar',
    view_all_catalog: 'Ver todo el catálogo',
    comments_title: 'Comentarios',
    write_comment: 'Escribe un comentario…',
    publish_comment: 'Publicar comentario',
    forum_new_thread: 'Crear Hilo',
    forum_read_more: 'Leer más →',
    search_placeholder: 'Buscar…',
    home_badge: 'Bitácora Oficial & Diario',
    home_subtitle: 'Novedades, lanzamientos directos de audio sin compresión, tienda exclusiva y comunidad.',
    home_read_full: 'Leer completo',
    home_view_full_post: 'Ver Bitácora Completa',
    home_listen: 'Escuchar',
    shop_all: 'Todos',
    shop_music: 'Música',
    shop_merch: 'Merch',
    shop_recent: 'Recientes',
    shop_popular: 'Populares',
    shop_price_asc: 'Precio ↑',
    shop_price_desc: 'Precio ↓',
    shop_explore: 'Explorar',
    product_digital_release: 'Lanzamiento Digital',
    product_physical_edition: 'Edición Física',
    product_instant_delivery: 'Entrega digital inmediata',
    product_fast_shipping: 'Envío con seguimiento disponible',
    product_specs_title: 'Especificaciones Técnicas del Proyecto',
    product_vote_label: 'Votación del producto:',
    product_select_size: 'Seleccionar Talla:',
    login_badge: 'Acceso de miembros',
    login_title: 'Iniciar sesión',
    login_subtitle: 'Entra para comentar, votar y acceder a tu biblioteca sleepyred999.',
    login_no_account: '¿No tienes una cuenta aún?',
    login_register_cta: 'Crear cuenta gratis →',
    logout: 'Cerrar sesión',
  },
  en: {
    nav_home: 'Home',
    nav_shop: 'Store',
    nav_community: 'Forum',
    nav_player: 'Web Player',
    nav_library: 'Library',
    nav_orders: 'My Orders',
    nav_profile: 'My Profile',
    nav_admin: 'Admin Panel',
    nav_login: 'Log In',
    nav_register: 'Sign Up',
    nav_new_badge: 'NEW',
    cart_title: 'Shopping Cart',
    cart_empty: 'Your cart is empty',
    cart_checkout: 'Proceed to Checkout',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    back_to_shop: 'Back to Product Catalog',
    back_to_blog: 'Back to blog',
    more_like_this: "You'd also like",
    view_all_catalog: 'View full catalog',
    comments_title: 'Comments',
    write_comment: 'Write a comment…',
    publish_comment: 'Post comment',
    forum_new_thread: 'Create Thread',
    forum_read_more: 'Read more →',
    search_placeholder: 'Search…',
    home_badge: 'Official Blog & Journal',
    home_subtitle: 'News, uncompressed studio master releases, exclusive merch store & community.',
    home_read_full: 'Read full post',
    home_view_full_post: 'Read Full Entry',
    home_listen: 'Listen',
    shop_all: 'All',
    shop_music: 'Music',
    shop_merch: 'Merch',
    shop_recent: 'Latest',
    shop_popular: 'Popular',
    shop_price_asc: 'Price ↑',
    shop_price_desc: 'Price ↓',
    shop_explore: 'Explore',
    product_digital_release: 'Digital Release',
    product_physical_edition: 'Physical Edition',
    product_instant_delivery: 'Instant digital delivery',
    product_fast_shipping: 'Tracked shipping available',
    product_specs_title: 'Project Technical Specifications',
    product_vote_label: 'Product rating:',
    product_select_size: 'Select Size:',
    login_badge: 'Member Access',
    login_title: 'Log In',
    login_subtitle: 'Sign in to comment, vote, and access your sleepyred999 library.',
    login_no_account: "Don't have an account yet?",
    login_register_cta: 'Create a free account →',
    logout: 'Log out',
  },
}

const i18nContext = createContext<i18nContextType>({
  lang: 'es',
  setLang: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('es')

  useEffect(() => {
    const saved = localStorage.getItem('sleepy_lang') as Language
    if (saved === 'es' || saved === 'en') {
      setLangState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('sleepy_lang', newLang)
    document.cookie = `sleepy_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = newLang
  }

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['es']?.[key] || key
  }

  return (
    <i18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </i18nContext.Provider>
  )
}

export function useLanguage() {
  return useContext(i18nContext)
}
