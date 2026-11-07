export type BannerPreset = {
  id: string
  name: string
  category: 'studio' | 'official' | 'minimal' | 'unlocked'
  url: string
  description: string
}

export type AvatarPreset = {
  id: string
  name: string
  url: string
  isUnlockedCover?: boolean
}

export type SongPreset = {
  id: string
  productId?: string
  title: string
  artist: string
  subtitle: string
  audioPreviewUrl: string
  thumbnailUrl: string
  durationSeconds: number
  priceCents?: number
}

export type StickerPreset = {
  id: string
  name: string
  emoji: string
  label: string
  rarity: 'holo' | 'foil' | 'gold' | 'studio'
  bgGradient: string
  borderClass: string
  textClass: string
  description: string
}

export const STICKER_PRESETS: StickerPreset[] = [
  {
    id: '999-flame-holo',
    name: '999 Ignición Holográfica',
    emoji: '🔥',
    label: '999 HOLO',
    rarity: 'holo',
    bgGradient: 'from-red-600/35 via-orange-500/25 to-rose-700/35',
    borderClass: 'border-red-500/70 shadow-red-900/50',
    textClass: 'text-red-200',
    description: 'Sticker holográfico oficial de la comunidad sleepyred999',
  },
  {
    id: 'studio-master-gold',
    name: '24-Bit Studio Crown',
    emoji: '👑',
    label: '24-BIT MASTER',
    rarity: 'gold',
    bgGradient: 'from-amber-500/35 via-yellow-500/20 to-amber-800/35',
    borderClass: 'border-amber-400/70 shadow-amber-900/50',
    textClass: 'text-amber-200',
    description: 'Insignia dorada de oyente de másters sin compresión',
  },
  {
    id: 'vinyl-press-foil',
    name: 'Direct-To-Vinyl Foil',
    emoji: '💿',
    label: 'VINYL FOIL',
    rarity: 'foil',
    bgGradient: 'from-fuchsia-600/30 via-purple-600/20 to-red-700/30',
    borderClass: 'border-fuchsia-400/70 shadow-fuchsia-900/40',
    textClass: 'text-fuchsia-200',
    description: 'Edición prensado directo de estudio',
  },
  {
    id: 'fly-sessions-wing',
    name: 'Fly Sessions pt. 1 Holo',
    emoji: '🕊️',
    label: 'FLY SESSIONS',
    rarity: 'holo',
    bgGradient: 'from-sky-500/30 via-emerald-500/20 to-cyan-800/35',
    borderClass: 'border-sky-400/70 shadow-sky-900/40',
    textClass: 'text-sky-200',
    description: 'Sticker conmemorativo de Arde (Fly Sessions pt. 1)',
  },
  {
    id: 'criss-angel-sigil',
    name: 'Criss Angel Levitate',
    emoji: '🪄',
    label: 'LEVITATE',
    rarity: 'foil',
    bgGradient: 'from-rose-600/35 via-red-700/25 to-neutral-900/60',
    borderClass: 'border-rose-500/70 shadow-rose-950/50',
    textClass: 'text-rose-200',
    description: 'Sello del lanzamiento oficial Criss Angel',
  },
  {
    id: 'odm-club-gold',
    name: 'O.D.M. Midnight Gold',
    emoji: '⚡',
    label: 'O.D.M. VIP',
    rarity: 'gold',
    bgGradient: 'from-yellow-500/30 via-red-600/25 to-neutral-950/60',
    borderClass: 'border-yellow-500/70 shadow-yellow-950/50',
    textClass: 'text-yellow-200',
    description: 'Insignia nocturna del corte O.D.M.',
  },
  {
    id: 'red-rec-studio',
    name: 'Red Recordings Engineer',
    emoji: '🎚️',
    label: 'RED REC',
    rarity: 'studio',
    bgGradient: 'from-red-800/40 via-neutral-800/40 to-red-950/50',
    borderClass: 'border-red-600/70 shadow-red-950/50',
    textClass: 'text-red-300',
    description: 'Consola de ingeniería Red Recordings',
  },
  {
    id: 'sub-bass-architect',
    name: '808 Sub-Bass Architect',
    emoji: '🔊',
    label: '808 SUB',
    rarity: 'holo',
    bgGradient: 'from-emerald-500/30 via-teal-600/20 to-neutral-900/50',
    borderClass: 'border-emerald-400/70 shadow-emerald-950/40',
    textClass: 'text-emerald-200',
    description: 'Frecuencias sub-graves calibradas a 0 dBFS',
  },
]

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
  {
    id: 'arde-fly-sessions-pt-1',
    name: 'Arde — Fly Sessions pt. 1 (Arte Oficial)',
    category: 'official',
    url: '/songs/arde-fly-sessions-pt-1/flysessions1.jpg',
    description: 'Portada oficial del lanzamiento Arde (Fly Sessions pt. 1)',
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
    id: 'arde-fly-sessions-pt-1',
    title: 'Arde (Fly Sessions pt. 1)',
    artist: 'sleepyred999',
    subtitle: 'Caminando en el parque, y no pude evitarlo...',
    audioPreviewUrl: '/songs/arde-fly-sessions-pt-1/flysessions1.wav',
    thumbnailUrl: '/songs/arde-fly-sessions-pt-1/flysessions1.jpg',
    durationSeconds: 30,
    priceCents: 99,
  },
  {
    id: 'odm',
    title: 'O.D.M. (Master Edit)',
    artist: 'sleepyred999',
    subtitle: 'Edición especial de estudio sin compresión',
    audioPreviewUrl: '/songs/odm/ODM.wav',
    thumbnailUrl: '/songs/odm/odm.jpg',
    durationSeconds: 30,
    priceCents: 99,
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
const STICKERS_MARKER = ' ||stickers:'

/**
 * Extrae el texto limpio de status_update sin los marcadores internos de canción favorita o stickers.
 */
export function extractProfileStatus(rawStatus?: string | null): string {
  if (!rawStatus) return ''
  let clean = rawStatus
  const sIdx = clean.indexOf(STICKERS_MARKER)
  if (sIdx !== -1) clean = clean.slice(0, sIdx)
  const fIdx = clean.indexOf(FAV_SONG_MARKER)
  if (fIdx !== -1) clean = clean.slice(0, fIdx)
  return clean.trim()
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
      let rest = profile.status_update.slice(idx + FAV_SONG_MARKER.length)
      const sIdx = rest.indexOf(STICKERS_MARKER)
      if (sIdx !== -1) rest = rest.slice(0, sIdx)
      const markerVal = rest.trim()
      if (markerVal) return markerVal
    }
  }
  return profile.favorite_product_id || null
}

/**
 * Extrae los IDs de stickers equipados en la vitrina del perfil.
 */
export function extractProfileStickers(rawStatus?: string | null): string[] {
  const defaultStickers = [
    '999-flame-holo',
    'studio-master-gold',
    'fly-sessions-wing',
  ]
  if (!rawStatus) return defaultStickers
  const idx = rawStatus.indexOf(STICKERS_MARKER)
  if (idx === -1) return defaultStickers
  let rest = rawStatus.slice(idx + STICKERS_MARKER.length)
  const fIdx = rest.indexOf(FAV_SONG_MARKER)
  if (fIdx !== -1) rest = rest.slice(0, fIdx)
  const rawList = rest.trim()
  if (rawList === 'none') return []
  const ids = rawList
    .split(',')
    .map((s) => s.trim())
    .filter((id) => STICKER_PRESETS.some((p) => p.id === id))
    .slice(0, 4)
  return ids.length > 0 ? ids : defaultStickers
}

export function getStickersByIds(ids: string[]): StickerPreset[] {
  return ids
    .map((id) => STICKER_PRESETS.find((s) => s.id === id))
    .filter((s): s is StickerPreset => Boolean(s))
}

/**
 * Combina el status_update visible con el identificador de canción preset y los stickers equipados.
 */
export function encodeProfileStatusWithFavSong(
  cleanStatus: string,
  favSongPresetSlug?: string | null,
  stickerIds?: string[] | null
): string | null {
  let result = cleanStatus.trim()
  if (favSongPresetSlug) {
    result += `${FAV_SONG_MARKER}${favSongPresetSlug}`
  }
  if (stickerIds) {
    const cleanIds = stickerIds
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)
    result += `${STICKERS_MARKER}${cleanIds.length > 0 ? cleanIds.join(',') : 'none'}`
  }
  return result || null
}

