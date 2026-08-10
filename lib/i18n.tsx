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
    nav_library: 'Biblioteca',
    nav_profile: 'Perfil',
    nav_admin: 'Panel Admin',
    nav_login: 'Iniciar Sesión',
    nav_register: 'Registrarse',
    cart_title: 'Carrito de Compras',
    cart_empty: 'Tu carrito está vacío',
    cart_checkout: 'Proceder al Pago',
    add_to_cart: 'Añadir al Carrito',
    buy_now: 'Comprar Ahora',
    back_to_shop: 'Volver a la Tienda',
    more_like_this: 'También te podría gustar',
    comments_title: 'Comentarios',
    write_comment: 'Escribe un comentario…',
    publish_comment: 'Publicar comentario',
    forum_new_thread: 'Crear Hilo',
    forum_read_more: 'Leer más →',
    search_placeholder: 'Buscar…',
  },
  en: {
    nav_home: 'Home',
    nav_shop: 'Store',
    nav_community: 'Forum',
    nav_library: 'Library',
    nav_profile: 'Profile',
    nav_admin: 'Admin Panel',
    nav_login: 'Log In',
    nav_register: 'Sign Up',
    cart_title: 'Shopping Cart',
    cart_empty: 'Your cart is empty',
    cart_checkout: 'Proceed to Checkout',
    add_to_cart: 'Add to Cart',
    buy_now: 'Buy Now',
    back_to_shop: 'Back to Shop',
    more_like_this: "You'd also like",
    comments_title: 'Comments',
    write_comment: 'Write a comment…',
    publish_comment: 'Post comment',
    forum_new_thread: 'Create Thread',
    forum_read_more: 'Read more →',
    search_placeholder: 'Search…',
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
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('sleepy_lang', newLang)
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
