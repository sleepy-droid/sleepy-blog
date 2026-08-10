'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type PasswordInputProps = {
  id: string
  name: string
  label: string
  autoComplete?: string
  required?: boolean
  minLength?: number
  placeholder?: string
  className?: string
}

/**
 * Campo de contraseña con toggle mostrar/ocultar (QoL de auth).
 */
export function PasswordInput({
  id,
  name,
  label,
  autoComplete = 'current-password',
  required = true,
  minLength = 8,
  placeholder = '••••••••',
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-neutral-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors cursor-pointer"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
