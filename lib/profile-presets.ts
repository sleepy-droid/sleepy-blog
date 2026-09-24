export type BannerPreset = {
  id: string
  name: string
  category: 'official' | 'wallpaper' | 'fire'
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
    id: 'criss-angel',
    name: 'Criss Angel Official',
    category: 'official',
    url: '/songs/criss-angel/crissangel.jpg',
    description: 'Portada original del lanzamiento oficial Criss Angel',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Vinyl & Waveforms',
    category: 'wallpaper',
    url: '/images/banners/banner_cyber_neon.jpg',
    description: 'Estudio de vinilo oscuro con ondas rojas de neón',
  },
  {
    id: 'crimson-fire',
    name: 'Sonic Ascension Fire & Ash',
    category: 'fire',
    url: '/images/banners/banner_crimson_fire.jpg',
    description: 'Visualizador ardiente con fuego, ascuas y humo carmesí',
  },
]

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'cyber-red',
    name: 'Cyberpunk Red Hoodie',
    url: '/images/avatars/avatar_cyber_red.jpg',
  },
  {
    id: 'official-logo',
    name: 'Logo Oficial Sleepy',
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
    id: 'nocturnal-fire',
    title: 'Fire & Ash (Club Mix)',
    artist: 'sleepyred999',
    subtitle: 'Edición especial de alto impacto',
    audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    thumbnailUrl: '/images/banners/banner_crimson_fire.jpg',
    durationSeconds: 30,
  },
]

export function getSongById(id?: string | null): SongPreset {
  if (!id) return SONG_PRESETS[0]
  const found = SONG_PRESETS.find((s) => s.id === id)
  return found || SONG_PRESETS[0]
}
