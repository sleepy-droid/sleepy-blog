import fs from 'fs'
import path from 'path'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product, ProductFolderStats, ProductFileInfo } from './types'

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
 * Escanea el sistema de archivos local en public/ para detectar la carpeta
 * asociada a un producto y calcular el peso real de los másters y archivos.
 */
export function getProductFolderStats(product: Product): ProductFolderStats | null {
  try {
    const publicDir = path.resolve(process.cwd(), 'public')
    const candidates: string[] = []

    // 0. Si tiene storage_folder_path explícito
    if (product.storage_folder_path) {
      const cleanFolder = product.storage_folder_path.replace(/^\/+/, '')
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, cleanFolder))
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
        candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, match[1], match[2]))
      }
    }

    // 2. Extraer candidato por slug o variaciones de slug
    if (product.slug) {
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'songs', product.slug))
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'merch', product.slug))
      const compactSlug = product.slug.replace(/[-_.]/g, '')
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'songs', compactSlug))
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'merch', compactSlug))
    }

    // 3. Extraer candidato por nombre normalizado
    if (product.name) {
      const cleanName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'songs', cleanName))
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'merch', cleanName))
    }

    // Buscar el primer directorio que exista
    let targetDir: string | null = null
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        targetDir = candidate
        break
      }
    }

    if (!targetDir) {
      return null
    }

    const relativeFolder = path.relative(publicDir, targetDir).replace(/\\/g, '/')
    const dirents = fs
      .readdirSync(targetDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
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

    for (const dirent of dirents) {
      if (!dirent.isFile()) continue
      if (dirent.name === 'manifest.json' || dirent.name.startsWith('.')) continue

      const filePath = path.join(targetDir, dirent.name)
      const stats = fs.statSync(filePath)
      const ext = path.extname(dirent.name).toLowerCase()
      const lowerName = dirent.name.toLowerCase()
      const humanTitle = path
        .basename(dirent.name, ext)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

      files.push({
        name: dirent.name,
        title: humanTitle || dirent.name,
        publicUrl: `/${relativeFolder}/${dirent.name}`,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        extension: ext,
      })

      totalSizeBytes += stats.size

      if (lowerName.includes('acapella') || lowerName.includes('vocal')) {
        hasAcapella = true
        acapellaSize += stats.size
      } else if (lowerName.includes('instrumental') || lowerName.includes('instru') || lowerName.includes('beat')) {
        hasInstrumental = true
        instrumentalSize += stats.size
      } else if (ext === '.wav') {
        hasWav = true
        wavSize += stats.size
      } else if (ext === '.mp3') {
        hasMp3 = true
        mp3Size += stats.size
      } else if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        hasCover = true
        coverSize += stats.size
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
  } catch (err) {
    console.error('Error computing product folder stats:', err)
    return null
  }
}
