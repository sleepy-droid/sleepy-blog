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
}

/**
 * Provisiona automáticamente el directorio del producto (en `public/songs/<slug>` o `public/merch/<slug>`
 * cuando el disco local es escribible, y en los buckets `public-media` / `private-vault` de Supabase Storage
 * para producción/CDN). Guarda todos los archivos subidos en el formulario Admin dentro de dicha carpeta.
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
  const result: UploadedProductMediaResult = { folderRelativePath }

  const publicDir = path.resolve(process.cwd(), 'public')
  const localTargetDir = path.join(/*turbopackIgnore: true*/ publicDir, ...folderRelativePath.split('/'))

  let canWriteLocal = false
  try {
    fs.mkdirSync(localTargetDir, { recursive: true })
    const manifestPath = path.join(localTargetDir, 'manifest.json')
    const manifestData = {
      slug,
      name,
      category,
      fulfillment,
      folder: `/${folderRelativePath}`,
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8')
    canWriteLocal = true
  } catch {
    // En entornos serverless de solo lectura (ej. Vercel), continuamos con Supabase Storage CDN
    canWriteLocal = false
  }

  const fileSlots: Array<{
    fieldName: string
    resultKey: keyof Omit<UploadedProductMediaResult, 'folderRelativePath'>
    prefix: string
    bucket: 'public-media' | 'private-vault'
  }> = [
    { fieldName: 'cover_file', resultKey: 'thumbnail_url', prefix: 'cover', bucket: 'public-media' },
    { fieldName: 'mp3_file', resultKey: 'mp3_url', prefix: 'preview', bucket: 'public-media' },
    { fieldName: 'wav_file', resultKey: 'wav_url', prefix: 'master', bucket: 'private-vault' },
    { fieldName: 'acapella_file', resultKey: 'acapella_url', prefix: 'acapella', bucket: 'private-vault' },
    { fieldName: 'instrumental_file', resultKey: 'instrumental_url', prefix: 'instrumental', bucket: 'private-vault' },
  ]

  for (const slot of fileSlots) {
    const entry = formData.get(slot.fieldName)
    if (!entry || typeof entry === 'string' || !(entry instanceof File) || entry.size === 0) {
      continue
    }

    const cleanName = sanitizeFilename(entry.name, slot.prefix)
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
          const { data: pubData } = supabase.storage.from(slot.bucket).getPublicUrl(storageObjectKey)
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
      result[slot.resultKey] = resolvedUrl
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

    const dirents = fs.readdirSync(targetDir, { withFileTypes: true })
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

      files.push({
        name: dirent.name,
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

    const relativeFolder = path.relative(publicDir, targetDir).replace(/\\/g, '/')

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
