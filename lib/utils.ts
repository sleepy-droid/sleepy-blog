import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CANONICAL_SONG_ASSET_ALIASES: Record<string, string> = {
  '/songs/arde-fly-sessions-pt-1/3000x3000bb-flysessions1.jpg':
    '/songs/arde-fly-sessions-pt-1/flysessions1.jpg',
  '/songs/arde-fly-sessions-pt-1/cover.jpg':
    '/songs/arde-fly-sessions-pt-1/flysessions1.jpg',
  '/songs/arde-fly-sessions-pt-1/7flysessionsifminor.wav':
    '/songs/arde-fly-sessions-pt-1/flysessions1.wav',
  '/songs/arde-fly-sessions-pt-1/master.wav':
    '/songs/arde-fly-sessions-pt-1/flysessions1.wav',
  '/songs/arde-fly-sessions-pt-1/preview.mp3':
    '/songs/arde-fly-sessions-pt-1/flysessions1.wav',
  '/songs/odm/odm.wav': '/songs/odm/ODM.wav',
  '/songs/odm/odm.jpg': '/songs/odm/odm.jpg',
  '/songs/criss-angel/crissangel.jpg': '/songs/criss-angel/crissangel.jpg',
  '/songs/criss-angel/crissangel.mp3': '/songs/criss-angel/crissangel.mp3',
  '/songs/criss-angel/crissangel.wav': '/songs/criss-angel/crissangel.wav',
}

/**
 * Normaliza cualquier ruta de imagen o archivo de audio/media para que sea válida en Next.js y en el navegador.
 * Maneja:
 * - Backslashes de Windows: 'public\songs\odm\odm.jpg' -> '/songs/odm/odm.jpg'
 * - Prefijo 'public/': 'public/songs/odm/odm.jpg' -> '/songs/odm/odm.jpg'
 * - Falta de slash inicial: 'songs/odm/odm.jpg' -> '/songs/odm/odm.jpg'
 * - Aliases de archivos renombrados en public/songs/* (ej. arde-fly-sessions-pt-1)
 * - URLs absolutas HTTP/HTTPS o Data URLs: se mantienen intactas.
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return ''
  let cleaned = String(url).trim()
  if (!cleaned) return ''

  // URLs remotas o data URLs se conservan
  if (/^(https?:|\/\/|data:)/i.test(cleaned)) {
    return cleaned
  }

  // Convertir todas las barras invertidas de Windows a barras normales
  cleaned = cleaned.replace(/\\+/g, '/')

  // Eliminar prefijo './'
  cleaned = cleaned.replace(/^\.\//, '')

  // Eliminar prefijo 'public/' o '/public/' (Next.js sirve la carpeta public desde la raíz '/')
  cleaned = cleaned.replace(/^\/?public\//i, '/')

  // Asegurar que empiece con '/'
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned
  }

  const lowerCleaned = cleaned.toLowerCase()
  if (CANONICAL_SONG_ASSET_ALIASES[lowerCleaned]) {
    return CANONICAL_SONG_ASSET_ALIASES[lowerCleaned]
  }

  // Si apunta a cualquier imagen o audio dentro de /songs/arde-fly-sessions-pt-1/ con nombre antiguo
  if (lowerCleaned.startsWith('/songs/arde-fly-sessions-pt-1/')) {
    if (/\.(jpg|jpeg|png|webp|avif)$/i.test(lowerCleaned)) {
      return '/songs/arde-fly-sessions-pt-1/flysessions1.jpg'
    }
    if (/\.(wav|mp3|ogg|flac|m4a)$/i.test(lowerCleaned)) {
      return '/songs/arde-fly-sessions-pt-1/flysessions1.wav'
    }
  }

  return cleaned
}

/**
 * Parsea una o múltiples URLs de imagen/media separadas por comas, puntos y comas o saltos de línea.
 * Permite manejar tanto una portada individual como álbumes/recaps de varias fotos sin deformar la interfaz.
 */
export function parseMediaUrls(raw?: string | null): string[] {
  if (!raw) return []
  return String(raw)
    .split(/[\n,;]+/)
    .map((s) => normalizeMediaUrl(s.trim()))
    .filter(Boolean)
}
