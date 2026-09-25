import fs from 'fs'
import path from 'path'
import type { Product, ProductFolderStats, ProductFileInfo } from './types'

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Escanea el sistema de archivos local en public/ para detectar la carpeta
 * asociada a un producto y calcular el peso real de los másters y archivos.
 */
export function getProductFolderStats(product: Product): ProductFolderStats | null {
  try {
    const publicDir = path.resolve(process.cwd(), 'public')
    const candidates: string[] = []

    // 1. Extraer ruta desde thumbnail_url, wav_url o mp3_url si apuntan a /songs/ o /merch/
    const urls = [product.thumbnail_url, product.wav_url, product.mp3_url, product.audio_preview_url]
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
      // Casos como slug "o-d-m" -> carpeta "odm"
      const compactSlug = product.slug.replace(/[-_.]/g, '')
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'songs', compactSlug))
      candidates.push(path.join(/*turbopackIgnore: true*/ publicDir, 'merch', compactSlug))
    }

    // 3. Extraer candidato por nombre normalizado
    if (product.name) {
      const cleanName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      candidates.push(path.join(publicDir, 'songs', cleanName))
      candidates.push(path.join(publicDir, 'merch', cleanName))
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

    for (const dirent of dirents) {
      if (!dirent.isFile()) continue
      const filePath = path.join(targetDir, dirent.name)
      const stats = fs.statSync(filePath)
      const ext = path.extname(dirent.name).toLowerCase()

      files.push({
        name: dirent.name,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        extension: ext,
      })

      totalSizeBytes += stats.size

      if (ext === '.wav') {
        hasWav = true
        wavSize += stats.size
      } else if (ext === '.mp3') {
        hasMp3 = true
        mp3Size += stats.size
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
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
    }
  } catch (err) {
    console.error('Error computing product folder stats:', err)
    return null
  }
}
