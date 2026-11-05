import fs from 'fs'
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product, Post, ProductFolderStats, ProductFileInfo } from './types'
import { normalizeMediaUrl } from './utils'

/**
 * Inventario estático de respaldo de `public/songs/*` para entornos Serverless (ej. Vercel)
 * donde los archivos de `public/` se sirven directamente desde el Edge CDN y no se empaquetan
 * dentro del contenedor Lambda de las funciones serverless.
 */
const STATIC_PUBLIC_FOLDERS: Record<string, Array<{ name: string; title: string; sizeBytes: number }>> = {
  'songs/arde-fly-sessions-pt-1': [
    { name: 'flysessions1.jpg', title: 'Flysessions1', sizeBytes: 4967637 },
    { name: 'flysessions1.wav', title: 'Arde (Fly Sessions pt. 1)', sizeBytes: 48606002 },
  ],
  'songs/odm': [
    { name: 'odm.jpg', title: 'Odm', sizeBytes: 8419901 },
    { name: 'ODM.wav', title: 'O.D.M.', sizeBytes: 53656626 },
  ],
  'songs/criss-angel': [
    { name: 'crissangel.jpg', title: 'Crissangel', sizeBytes: 83284 },
    { name: 'crissangel.mp3', title: 'Criss Angel', sizeBytes: 8945229 },
    { name: 'crissangel.wav', title: 'Criss Angel', sizeBytes: 8945229 },
  ],
  'songs/red-recordings': [
    { name: 'cover.jpg', title: 'Cover', sizeBytes: 1325947 },
    { name: 'preview.mp3', title: 'Red Recordings', sizeBytes: 8945229 },
  ],
}

function buildFolderStatsFromEntries(
  relativeFolder: string,
  entries: Array<{ name: string; title?: string; sizeBytes: number }>
): ProductFolderStats {
  const files: ProductFileInfo[] = []
  let totalSizeBytes = 0
  let hasWav = false
  let wavSize = 0
  let hasMp3 = false
  let mp3Size = 0
  let hasCover = false
  let coverSize = 0
  let hasAcapella = false
  let acapellaSize = 0
  let hasInstrumental = false
  let instrumentalSize = 0

  for (const item of entries) {
    const ext = path.extname(item.name).toLowerCase()
    const lowerName = item.name.toLowerCase()
    const humanTitle =
      item.title ||
      path
        .basename(item.name, ext)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

    files.push({
      name: item.name,
      title: humanTitle || item.name,
      publicUrl: `/${relativeFolder}/${item.name}`,
      sizeBytes: item.sizeBytes,
      sizeFormatted: formatBytes(item.sizeBytes),
      extension: ext,
    })

    totalSizeBytes += item.sizeBytes

    if (lowerName.includes('acapella') || lowerName.includes('vocal')) {
      hasAcapella = true
      acapellaSize += item.sizeBytes
    } else if (
      lowerName.includes('instrumental') ||
      lowerName.includes('instru') ||
      lowerName.includes('beat')
    ) {
      hasInstrumental = true
      instrumentalSize += item.sizeBytes
    } else if (ext === '.wav') {
      hasWav = true
      wavSize += item.sizeBytes
    } else if (ext === '.mp3') {
      hasMp3 = true
      mp3Size += item.sizeBytes
    } else if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      hasCover = true
      coverSize += item.sizeBytes
    }
  }

  return {
    folderPath: relativeFolder,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    filesCount: files.length,
    files,
    hasWav,
    wavSizeFormatted: hasWav ? formatBytes(wavSize) : undefined,
    hasMp3,
    mp3SizeFormatted: hasMp3 ? formatBytes(mp3Size) : undefined,
    hasCover,
    coverSizeFormatted: hasCover ? formatBytes(coverSize) : undefined,
    hasAcapella,
    acapellaSizeFormatted: hasAcapella ? formatBytes(acapellaSize) : undefined,
    hasInstrumental,
    instrumentalSizeFormatted: hasInstrumental ? formatBytes(instrumentalSize) : undefined,
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function getCanonicalProductFolder(slug: string, category: string, fulfillment: string): string {
  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled'
  const isMusicOrDigital = category === 'music' || fulfillment === 'digital'
  return `${isMusicOrDigital ? 'songs' : 'merch'}/${safeSlug}`
}

function sanitizeFilename(originalName: string, fallbackPrefix: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || fallbackPrefix}${ext}`
}

export type UploadedProductMediaResult = {
  folderRelativePath: string
  thumbnail_url?: string
  mp3_url?: string
  wav_url?: string
  acapella_url?: string
  instrumental_url?: string
  cover_urls?: string[]
  mp3_urls?: string[]
  wav_urls?: string[]
  acapella_urls?: string[]
  instrumental_urls?: string[]
}

/**
 * Provisiona automáticamente el directorio del producto (en `public/songs/<slug>` o `public/merch/<slug>`
 * cuando el disco local es escribible, y en los buckets `public-media` / `private-vault` de Supabase Storage
 * para producción/CDN). Guarda todos los archivos subidos (incluyendo álbumes con múltiples .wav / .mp3)
 * en el formulario Admin dentro de dicha carpeta.
 */
export async function provisionProductDirectoryAndUpload(params: {
  slug: string
  name: string
  category: string
  fulfillment: string
  formData: FormData
  supabase: SupabaseClient
}): Promise<UploadedProductMediaResult> {
  const { slug, name, category, fulfillment, formData, supabase } = params
  const folderRelativePath = getCanonicalProductFolder(slug, category, fulfillment)
  const result: UploadedProductMediaResult = {
    folderRelativePath,
    cover_urls: [],
    mp3_urls: [],
    wav_urls: [],
    acapella_urls: [],
    instrumental_urls: [],
  }

  const publicDir = path.resolve(process.cwd(), 'public')
  const localTargetDir = path.join(/*turbopackIgnore: true*/ publicDir, ...folderRelativePath.split('/'))

  let canWriteLocal = false
  try {
    fs.mkdirSync(localTargetDir, { recursive: true })
    canWriteLocal = true
  } catch {
    // En entornos serverless de solo lectura (ej. Vercel), continuamos con Supabase Storage CDN
    canWriteLocal = false
  }

  const fileSlots: Array<{
    fieldName: string
    resultKey: 'thumbnail_url' | 'mp3_url' | 'wav_url' | 'acapella_url' | 'instrumental_url'
    listKey: 'cover_urls' | 'mp3_urls' | 'wav_urls' | 'acapella_urls' | 'instrumental_urls'
    prefix: string
    bucket: 'public-media' | 'private-vault'
  }> = [
    {
      fieldName: 'cover_file',
      resultKey: 'thumbnail_url',
      listKey: 'cover_urls',
      prefix: 'cover',
      bucket: 'public-media',
    },
    {
      fieldName: 'mp3_file',
      resultKey: 'mp3_url',
      listKey: 'mp3_urls',
      prefix: 'preview',
      bucket: 'public-media',
    },
    {
      fieldName: 'wav_file',
      resultKey: 'wav_url',
      listKey: 'wav_urls',
      prefix: 'master',
      bucket: 'private-vault',
    },
    {
      fieldName: 'acapella_file',
      resultKey: 'acapella_url',
      listKey: 'acapella_urls',
      prefix: 'acapella',
      bucket: 'private-vault',
    },
    {
      fieldName: 'instrumental_file',
      resultKey: 'instrumental_url',
      listKey: 'instrumental_urls',
      prefix: 'instrumental',
      bucket: 'private-vault',
    },
  ]

  const usedFilenames = new Set<string>()

  for (const slot of fileSlots) {
    const entries = formData.getAll(slot.fieldName)
    let slotIndex = 0

    for (const entry of entries) {
      if (!entry || typeof entry === 'string' || !(entry instanceof File) || entry.size === 0) {
        continue
      }
      slotIndex++

      let cleanName = sanitizeFilename(
        entry.name,
        entries.length > 1 ? `${slot.prefix}-${slotIndex}` : slot.prefix
      )
      if (usedFilenames.has(cleanName)) {
        const ext = path.extname(cleanName)
        const base = path.basename(cleanName, ext)
        cleanName = `${base}-${slotIndex}${ext}`
      }
      usedFilenames.add(cleanName)

      const storageObjectKey = `${folderRelativePath}/${cleanName}`
      const arrayBuffer = await entry.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      let resolvedUrl: string | undefined

      // 1. Guardar en el directorio local `public/<songs|merch>/<slug>/<archivo>` si el entorno lo permite
      if (canWriteLocal) {
        try {
          const destFile = path.join(localTargetDir, cleanName)
          fs.writeFileSync(destFile, buffer)
          resolvedUrl = `/${folderRelativePath}/${cleanName}`
        } catch (err) {
          console.error(`Error writing local file ${cleanName}:`, err)
        }
      }

      // 2. Sincronizar también con Supabase Storage CDN (y usar su URL si no hay disco local)
      try {
        const { error: uploadErr } = await supabase.storage
          .from(slot.bucket)
          .upload(storageObjectKey, buffer, {
            contentType: entry.type || 'application/octet-stream',
            upsert: true,
          })

        if (!uploadErr) {
          if (slot.bucket === 'public-media') {
            const { data: pubData } = supabase.storage
              .from(slot.bucket)
              .getPublicUrl(storageObjectKey)
            if (!resolvedUrl && pubData?.publicUrl) {
              resolvedUrl = pubData.publicUrl
            }
          } else if (!resolvedUrl) {
            // Para archivos en private-vault en producción serverless, guardamos la ruta canónica
            resolvedUrl = `/${storageObjectKey}`
          }
        }
      } catch {
        // Si el bucket aún no ha sido creado en Supabase, el respaldo en disco local mantiene todo operativo
      }

      if (resolvedUrl) {
        if (!result[slot.resultKey]) {
          result[slot.resultKey] = resolvedUrl
        }
        result[slot.listKey]?.push(resolvedUrl)
      }
    }
  }

  // Escribir o actualizar manifest.json con el inventario de pistas/archivos del producto o álbum
  if (canWriteLocal) {
    try {
      const manifestPath = path.join(localTargetDir, 'manifest.json')
      const manifestData = {
        slug,
        name,
        category,
        fulfillment,
        folder: `/${folderRelativePath}`,
        wav_urls: result.wav_urls,
        mp3_urls: result.mp3_urls,
        cover_urls: result.cover_urls,
        acapella_urls: result.acapella_urls,
        instrumental_urls: result.instrumental_urls,
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8')
    } catch {
      // Ignorar si no se puede escribir manifest.json
    }
  }

  return result
}

/**
 * Escanea el sistema de archivos local en public/ (o el inventario estático en Vercel Serverless)
 * para detectar la carpeta asociada a un producto y calcular el peso real de los másters y archivos.
 */
export function getProductFolderStats(product: Product): ProductFolderStats | null {
  try {
    const publicDir = path.resolve(process.cwd(), 'public')
    const relativeCandidates: string[] = []

    // 0. Si tiene storage_folder_path explícito
    if (product.storage_folder_path) {
      const cleanFolder = product.storage_folder_path.replace(/^\/+|\/+$/g, '')
      relativeCandidates.push(cleanFolder)
    }

    // 1. Extraer ruta desde thumbnail_url, wav_url, mp3_url, acapella_url o instrumental_url si apuntan a /songs/ o /merch/
    const urls = [
      product.thumbnail_url,
      product.wav_url,
      product.mp3_url,
      product.audio_preview_url,
      product.acapella_url,
      product.instrumental_url,
    ]
    for (const u of urls) {
      if (!u || typeof u !== 'string') continue
      const match = u.match(/(?:^\/)?(songs|merch)\/([^/]+)/i)
      if (match) {
        relativeCandidates.push(`${match[1].toLowerCase()}/${match[2]}`)
      }
    }

    // 2. Extraer candidato por slug o variaciones de slug
    if (product.slug) {
      relativeCandidates.push(`songs/${product.slug}`)
      relativeCandidates.push(`merch/${product.slug}`)
      const compactSlug = product.slug.replace(/[-_.]/g, '')
      relativeCandidates.push(`songs/${compactSlug}`)
      relativeCandidates.push(`merch/${compactSlug}`)
    }

    // 3. Extraer candidato por nombre normalizado
    if (product.name) {
      const cleanName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      relativeCandidates.push(`songs/${cleanName}`)
      relativeCandidates.push(`merch/${cleanName}`)
    }

    // Intentar primero en el sistema de archivos local (dev / build)
    for (const rel of relativeCandidates) {
      const candidate = path.join(/*turbopackIgnore: true*/ publicDir, ...rel.split('/'))
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        const relativeFolder = path.relative(publicDir, candidate).replace(/\\/g, '/')
        const dirents = fs
          .readdirSync(candidate, { withFileTypes: true })
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          )
        const entries: Array<{ name: string; sizeBytes: number }> = []
        for (const dirent of dirents) {
          if (!dirent.isFile()) continue
          if (dirent.name === 'manifest.json' || dirent.name.startsWith('.')) continue
          const filePath = path.join(candidate, dirent.name)
          const stats = fs.statSync(filePath)
          entries.push({ name: dirent.name, sizeBytes: stats.size })
        }
        if (entries.length > 0) {
          return buildFolderStatsFromEntries(relativeFolder, entries)
        }
      }
    }

    // Respaldo para Vercel Serverless Runtime: consultar inventario estático de public/songs/*
    for (const rel of relativeCandidates) {
      const normalizedRel = rel.replace(/\\/g, '/').toLowerCase()
      const matchedKey = Object.keys(STATIC_PUBLIC_FOLDERS).find(
        (k) => k.toLowerCase() === normalizedRel
      )
      if (matchedKey) {
        return buildFolderStatsFromEntries(matchedKey, STATIC_PUBLIC_FOLDERS[matchedKey])
      }
    }

    return null
  } catch (err) {
    console.error('Error computing product folder stats:', err)
    return null
  }
}

/**
 * Hidrata y auto-repara las URLs multimedia de un producto (`thumbnail_url`, `audio_preview_url`,
 * `wav_url`, `mp3_url`, `folder_stats`) verificándolas contra los archivos reales existentes
 * en `public/songs/<slug>` (o `public/merch/<slug>`).
 * Si un archivo fue renombrado en la carpeta `public/songs/<slug>` y la base de datos tenía
 * el nombre anterior, resuelve automáticamente el archivo válido presente en la carpeta.
 */
export function hydrateProductWithFolderAssets(product: Product): Product {
  const folderStats = product.folder_stats ?? getProductFolderStats(product)
  const files = folderStats?.files || []

  let thumbnail_url = normalizeMediaUrl(product.thumbnail_url) || null
  let wav_url = normalizeMediaUrl(product.wav_url) || null
  let mp3_url = normalizeMediaUrl(product.mp3_url) || null
  let audio_preview_url = normalizeMediaUrl(product.audio_preview_url) || null
  const acapella_url = normalizeMediaUrl(product.acapella_url) || null
  const instrumental_url = normalizeMediaUrl(product.instrumental_url) || null

  if (files.length > 0) {
    const fileUrlsLower = new Set(
      files.map((f) => (f.publicUrl || '').toLowerCase()).filter(Boolean)
    )
    const isMissingLocalFile = (url: string | null) => {
      if (!url) return true
      if (/^(https?:|\/\/|data:)/i.test(url)) return false
      if (url.startsWith('/songs/') || url.startsWith('/merch/')) {
        return !fileUrlsLower.has(url.toLowerCase())
      }
      return false
    }

    const coverFiles = files.filter((f) =>
      ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(f.extension)
    )
    const wavFiles = files.filter(
      (f) =>
        f.extension === '.wav' &&
        !f.name.toLowerCase().includes('acapella') &&
        !f.name.toLowerCase().includes('instrumental')
    )
    const mp3Files = files.filter((f) => f.extension === '.mp3')

    if (coverFiles.length > 0 && isMissingLocalFile(thumbnail_url)) {
      thumbnail_url = coverFiles[0].publicUrl || null
    }
    if (wavFiles.length > 0 && isMissingLocalFile(wav_url)) {
      wav_url = wavFiles[0].publicUrl || null
    }
    if (mp3Files.length > 0 && isMissingLocalFile(mp3_url)) {
      mp3_url = mp3Files[0].publicUrl || null
    }
    if (isMissingLocalFile(audio_preview_url)) {
      audio_preview_url =
        (mp3_url && !isMissingLocalFile(mp3_url) ? mp3_url : null) ||
        (wav_url && !isMissingLocalFile(wav_url) ? wav_url : null) ||
        mp3Files[0]?.publicUrl ||
        wavFiles[0]?.publicUrl ||
        audio_preview_url ||
        null
    }
  } else {
    if (!audio_preview_url) {
      audio_preview_url = mp3_url || wav_url || null
    }
  }

  return {
    ...product,
    thumbnail_url,
    wav_url,
    mp3_url,
    audio_preview_url,
    acapella_url,
    instrumental_url,
    folder_stats: folderStats,
  }
}

/**
 * Hidrata y auto-repara las URLs de imagen y audio de una publicación (Post) del blog,
 * sincronizando con su producto vinculado cuando una imagen en `/songs/<slug>` fue renombrada.
 */
export function hydratePostWithFolderAssets(post: Post, linkedProduct?: Product | null): Post {
  const hydratedProduct = linkedProduct ? hydrateProductWithFolderAssets(linkedProduct) : null

  let image_url = normalizeMediaUrl(post.image_url) || null
  let cover_url = normalizeMediaUrl(post.cover_url) || null
  let media_url = normalizeMediaUrl(post.media_url) || null

  if (hydratedProduct) {
    const prodFiles = hydratedProduct.folder_stats?.files || []
    const fileUrlsLower = new Set(
      prodFiles.map((f) => (f.publicUrl || '').toLowerCase()).filter(Boolean)
    )
    const isStaleSongUrl = (url: string | null) => {
      if (!url) return true
      if (
        (url.startsWith('/songs/') || url.startsWith('/merch/')) &&
        prodFiles.length > 0 &&
        !fileUrlsLower.has(url.toLowerCase())
      ) {
        return true
      }
      return false
    }

    if (hydratedProduct.thumbnail_url) {
      if (isStaleSongUrl(image_url)) {
        image_url = hydratedProduct.thumbnail_url
      }
      if (isStaleSongUrl(cover_url)) {
        cover_url = hydratedProduct.thumbnail_url
      }
    }

    const fallbackAudio =
      hydratedProduct.audio_preview_url || hydratedProduct.mp3_url || hydratedProduct.wav_url
    if (fallbackAudio && isStaleSongUrl(media_url)) {
      media_url = fallbackAudio
    }
  }

  return {
    ...post,
    image_url: image_url || cover_url,
    cover_url: cover_url || image_url,
    media_url,
    linked_product: hydratedProduct,
  }
}
