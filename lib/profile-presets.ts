export type BannerPreset = {
  id: string
  name: string
  category: 'studio' | 'official' | 'minimal'
  url: string
  description: string
}

export type AvatarPreset = {
  id: string
  name: string
  url: string
}

export type SongPreset = {
  id: string
  title: string
  artist: string
  subtitle: string
  audioPreviewUrl: string
  thumbnailUrl: string
  durationSeconds: number
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'studio-obsidian-grid',
    name: 'Consola Maestra Obsidian (24-Bit Grid)',
    category: 'studio',
    url: '/images/banners/studio-obsidian-grid.svg',
    description: 'Retícula arquitectónica de estudio de masterización con telemetría dBFS',
  },
  {
    id: 'crimson-acoustic-waves',
    name: 'Armónicos Acústicos Crimson',
    category: 'minimal',
    url: '/images/banners/crimson-acoustic-waves.svg',
    description: 'Curvas de fase y frecuencia minimalistas sobre negro obsidiana',
  },
  {
    id: 'monolith-vinyl-press',
    name: 'Monolith Direct-To-Master Vinyl',
    category: 'studio',
    url: '/images/banners/monolith-vinyl-press.svg',
    description: 'Surcos concéntricos de vinilo de edición coleccionista',
  },
  {
    id: 'criss-angel',
    name: 'Criss Angel (Arte Oficial)',
    category: 'official',
    url: '/songs/criss-angel/crissangel.jpg',
    description: 'Portada original del lanzamiento oficial Criss Angel',
  },
  {
    id: 'odm-official',
    name: 'O.D.M. (Arte Oficial)',
    category: 'official',
    url: '/songs/odm/odm.jpg',
    description: 'Arte visual oficial del lanzamiento O.D.M.',
  },
]

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'emblem-obsidian-crest',
    name: 'Emblema Prisma Studio',
    url: '/images/avatars/emblem-obsidian-crest.svg',
  },
  {
    id: 'emblem-vinyl-disc',
    name: 'Vinilo Master Press',
    url: '/images/avatars/emblem-vinyl-disc.svg',
  },
  {
    id: 'emblem-crimson-monogram',
    name: 'Monograma Frecuencia',
    url: '/images/avatars/emblem-crimson-monogram.svg',
  },
  {
    id: 'official-logo',
    name: 'Insignia sleepyred999',
    url: '/images/logos/PNG-04.png',
  },
]

export const SONG_PRESETS: SongPreset[] = [
  {
    id: 'criss-angel',
    title: 'Criss Angel (Master Edit)',
    artist: 'sleepyred999',
    subtitle: 'Lanzamiento Exclusivo sin compresión',
    audioPreviewUrl: '/songs/criss-angel/crissangel.mp3',
    thumbnailUrl: '/songs/criss-angel/crissangel.jpg',
    durationSeconds: 30,
  },
  {
    id: 'red-recordings',
    title: 'Red Recordings (VIP Dub)',
    artist: 'sleepyred999',
    subtitle: 'Producción de estudio oficial',
    audioPreviewUrl: '/songs/red-recordings/preview.mp3',
    thumbnailUrl: '/songs/red-recordings/cover.jpg',
    durationSeconds: 30,
  },
  {
    id: 'odm',
    title: 'O.D.M. (Master Edit)',
    artist: 'sleepyred999',
    subtitle: 'Edición especial de estudio sin compresión',
    audioPreviewUrl: '/songs/odm/ODM.wav',
    thumbnailUrl: '/songs/odm/odm.jpg',
    durationSeconds: 30,
  },
]

export function getSongById(id?: string | null, customList?: SongPreset[]): SongPreset {
  const list = customList && customList.length > 0 ? customList : SONG_PRESETS
  if (!id) return list[0]
  const cleanId = id.trim()
  const found =
    list.find((s) => s.id === cleanId) ||
    SONG_PRESETS.find((s) => s.id === cleanId)
  return found || list[0]
}

const FAV_SONG_MARKER = ' ||fav:'

/**
 * Extrae el texto limpio de status_update sin el marcador interno de canción favorita preset.
 */
export function extractProfileStatus(rawStatus?: string | null): string {
  if (!rawStatus) return ''
  const idx = rawStatus.indexOf(FAV_SONG_MARKER)
  if (idx === -1) return rawStatus.trim()
  return rawStatus.slice(0, idx).trim()
}

/**
 * Extrae el ID o slug de la canción favorita de cabecera del perfil,
 * priorizando el marcador de preset si existe o `favorite_product_id`.
 */
export function extractProfileFavSongId(profile?: {
  favorite_product_id?: string | null
  status_update?: string | null
} | null): string | null {
  if (!profile) return null
  if (profile.status_update) {
    const idx = profile.status_update.indexOf(FAV_SONG_MARKER)
    if (idx !== -1) {
      const markerVal = profile.status_update.slice(idx + FAV_SONG_MARKER.length).trim()
      if (markerVal) return markerVal
    }
  }
  return profile.favorite_product_id || null
}

/**
 * Combina el status_update visible con un identificador de canción preset cuando
 * la canción elegida no es un UUID en `public.products`.
 */
export function encodeProfileStatusWithFavSong(
  cleanStatus: string,
  favSongPresetSlug?: string | null
): string | null {
  const trimmed = cleanStatus.trim()
  if (!favSongPresetSlug) {
    return trimmed || null
  }
  return `${trimmed}${FAV_SONG_MARKER}${favSongPresetSlug}`
}

