'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Product } from './types'

export type CartItemType = {
  id: string
  product: Product
  variantLabel: string
  quantity: number
}

type CartContextType = {
  items: CartItemType[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  addToCart: (product: Product, variantLabel?: string, quantity?: number) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalCents: number
  totalItemsCount: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  isOpen: false,
  setIsOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalCents: 0,
  totalItemsCount: 0,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sleepy_cart')
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch {
      // ignore JSON parse errors
    }
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('sleepy_cart', JSON.stringify(items))
    } catch {
      // ignore write errors
    }
  }, [items])

  const addToCart = (product: Product, variantLabel = 'Standard', quantity = 1) => {
    setItems((prev) => {
      const itemId = `${product.id}-${variantLabel}`
      const existingIdx = prev.findIndex((item) => item.id === itemId)

      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx].quantity += quantity
        return copy
      }

      return [...prev, { id: itemId, product, variantLabel, quantity }]
    })
    setIsOpen(true)
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalCents = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0)
  }, [items])

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCents,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
