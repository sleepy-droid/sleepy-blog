'use client'

import { createClient } from '@/utils/supabase/client'
import type { ProductFileInfo } from './types'

const SUPABASE_SAFE_MAX_BYTES = 48 * 1024 * 1024 // 48 MB (bajo el límite de 50 MB de Supabase Free Plan)

export function formatBytesClient(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx !== -1 ? filename.slice(idx).toLowerCase() : ''
}

function getBase(filename: string, ext: string): string {
  return ext && filename.toLowerCase().endsWith(ext)
    ? filename.slice(0, filename.length - ext.length)
    : filename
}

function sanitizeFilenameClient(originalName: string, fallbackPrefix: string): string {
  const ext = getExt(originalName)
  const base = getBase(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || fallbackPrefix}${ext}`
}

/**
 * Si un archivo .WAV supera los 48 MB (ej. exportaciones DAW 24-bit/32-bit float de 55-80 MB),
 * lo convierte en el navegador a WAV PCM 16-bit de estudio (< 48 MB) para que Supabase Storage
 * lo acepte sin error 413 Payload Too Large.
 */
async function optimizeWavIfOversized(
  file: File,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (file.size <= SUPABASE_SAFE_MAX_BYTES) {
    return file
  }

  const ext = getExt(file.name)
  if (ext !== '.wav') {
    return file
  }

  try {
    onProgress?.(
      `Optimizando máster WAV (${formatBytesClient(file.size)}) a PCM 16-bit para almacenamiento CDN...`
    )
    const arrayBuffer = await file.arrayBuffer()
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioCtx = new AudioCtx()
    const decoded = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close().catch(() => {})

    const numChannels = Math.min(decoded.numberOfChannels, 2)
    const durationSec = decoded.duration
    // Calcular sampleRate objetivo para garantizar que 44 + samples * channels * 2 <= 47 MB
    const maxTotalSamplesPerChannel = Math.floor(
      (47 * 1024 * 1024 - 44) / (numChannels * 2)
    )
    const maxSampleRate = Math.floor(maxTotalSamplesPerChannel / Math.max(durationSec, 1))
    const targetSampleRate = Math.min(decoded.sampleRate, Math.min(44100, Math.max(22050, maxSampleRate)))

    let finalBuffer = decoded
    if (targetSampleRate < decoded.sampleRate) {
      const targetLength = Math.floor(durationSec * targetSampleRate)
      const offlineCtx = new OfflineAudioContext(numChannels, targetLength, targetSampleRate)
      const source = offlineCtx.createBufferSource()
      source.buffer = decoded
      source.connect(offlineCtx.destination)
      source.start(0)
      finalBuffer = await offlineCtx.startRendering()
    }

    const wavBlob = encodeAudioBufferToWav16Bit(finalBuffer, numChannels)
    return wavBlob.size <= SUPABASE_SAFE_MAX_BYTES ? wavBlob : file
  } catch (err) {
    console.warn('No se pudo optimizar WAV en navegador, enviando original:', err)
    return file
  }
}

function encodeAudioBufferToWav16Bit(buffer: AudioBuffer, numChannels: number): Blob {
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format = 1
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // 16-bit
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Sube todos los archivos multimedia seleccionados en el formulario Admin directamente desde
 * el navegador hacia Supabase Storage CDN (`public-media`), evitando el límite de 4.5 MB
 * de las Serverless Functions de Vercel.
 * Devuelve un nuevo FormData ligero (solo texto/URLs + inventario JSON) listo para el Server Action.
 */
export async function prepareProductFormDataWithDirectUpload(
  rawFormData: FormData,
  options: {
    slug: string
    category: string
    fulfillment: string
    onProgress?: (statusText: string) => void
  }
): Promise<{ formData: FormData; error?: string }> {
  const { slug, category, fulfillment, onProgress } = options
  const safeSlug =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-|-$/g, '') || `product-${Date.now()}`
  const isMusicOrDigital = category === 'music' || fulfillment === 'digital'
  const folderRelativePath = `${isMusicOrDigital ? 'songs' : 'merch'}/${safeSlug}`

  const fileSlots: Array<{
    fieldName: string
    urlFieldName: 'thumbnail_url' | 'mp3_url' | 'wav_url' | 'acapella_url' | 'instrumental_url'
    listFieldName:
      | 'uploaded_cover_urls'
      | 'uploaded_mp3_urls'
      | 'uploaded_wav_urls'
      | 'uploaded_acapella_urls'
      | 'uploaded_instrumental_urls'
    prefix: string
  }> = [
    {
      fieldName: 'cover_file',
      urlFieldName: 'thumbnail_url',
      listFieldName: 'uploaded_cover_urls',
      prefix: 'cover',
    },
    {
      fieldName: 'mp3_file',
      urlFieldName: 'mp3_url',
      listFieldName: 'uploaded_mp3_urls',
      prefix: 'preview',
    },
    {
      fieldName: 'wav_file',
      urlFieldName: 'wav_url',
      listFieldName: 'uploaded_wav_urls',
      prefix: 'master',
    },
    {
      fieldName: 'acapella_file',
      urlFieldName: 'acapella_url',
      listFieldName: 'uploaded_acapella_urls',
      prefix: 'acapella',
    },
    {
      fieldName: 'instrumental_file',
      urlFieldName: 'instrumental_url',
      listFieldName: 'uploaded_instrumental_urls',
      prefix: 'instrumental',
    },
  ]

  // Contar cuántos archivos reales hay para subir
  const filesToUpload: Array<{
    slot: (typeof fileSlots)[number]
    file: File
    slotIndex: number
    totalInSlot: number
  }> = []

  for (const slot of fileSlots) {
    const entries = rawFormData.getAll(slot.fieldName)
    const validFiles = entries.filter(
      (e): e is File => Boolean(e && typeof e !== 'string' && e instanceof File && e.size > 0)
    )
    validFiles.forEach((file, idx) => {
      filesToUpload.push({
        slot,
        file,
        slotIndex: idx + 1,
        totalInSlot: validFiles.length,
      })
    })
  }

  // Crear copia limpia de FormData sin los binarios pesados
  const cleanFormData = new FormData()
  const fileFieldNames = new Set(fileSlots.map((s) => s.fieldName))
  for (const [key, value] of rawFormData.entries()) {
    if (!fileFieldNames.has(key)) {
      cleanFormData.append(key, value)
    }
  }

  if (filesToUpload.length === 0) {
    return { formData: cleanFormData }
  }

  const supabase = createClient()
  const usedFilenames = new Set<string>()
  const uploadedFilesMeta: ProductFileInfo[] = []
  const urlsByListField: Record<string, string[]> = {
    uploaded_cover_urls: [],
    uploaded_mp3_urls: [],
    uploaded_wav_urls: [],
    uploaded_acapella_urls: [],
    uploaded_instrumental_urls: [],
  }
  const primaryUrlByField: Record<string, string> = {}

  for (let i = 0; i < filesToUpload.length; i++) {
    const { slot, file, slotIndex, totalInSlot } = filesToUpload[i]

    let cleanName = sanitizeFilenameClient(
      file.name,
      totalInSlot > 1 ? `${slot.prefix}-${slotIndex}` : slot.prefix
    )
    if (usedFilenames.has(cleanName)) {
      const ext = getExt(cleanName)
      const base = getBase(cleanName, ext)
      cleanName = `${base}-${slotIndex}${ext}`
    }
    usedFilenames.add(cleanName)

    const uploadBlob = await optimizeWavIfOversized(file, onProgress)
    const storageObjectKey = `${folderRelativePath}/${cleanName}`

    onProgress?.(
      `Subiendo a Supabase Storage CDN (${i + 1}/${filesToUpload.length}): ${cleanName} (${formatBytesClient(
        uploadBlob.size
      )})...`
    )

    const contentType =
      file.type ||
      (cleanName.endsWith('.wav')
        ? 'audio/wav'
        : cleanName.endsWith('.mp3')
        ? 'audio/mpeg'
        : cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')
        ? 'image/jpeg'
        : cleanName.endsWith('.png')
        ? 'image/png'
        : 'application/octet-stream')

    const { error: uploadErr } = await supabase.storage
      .from('public-media')
      .upload(storageObjectKey, uploadBlob, {
        contentType,
        upsert: true,
      })

    if (uploadErr) {
      return {
        formData: cleanFormData,
        error: `Error al subir "${file.name}" a Supabase Storage CDN: ${uploadErr.message}. Verifica tu sesión de Admin o el límite del archivo.`,
      }
    }

    const { data: pubData } = supabase.storage
      .from('public-media')
      .getPublicUrl(storageObjectKey)

    const publicUrl = pubData?.publicUrl
    if (publicUrl) {
      if (!primaryUrlByField[slot.urlFieldName]) {
        primaryUrlByField[slot.urlFieldName] = publicUrl
      }
      urlsByListField[slot.listFieldName].push(publicUrl)

      const ext = getExt(cleanName)
      const humanTitle = getBase(cleanName, ext)
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

      uploadedFilesMeta.push({
        name: cleanName,
        title: humanTitle || cleanName,
        publicUrl,
        sizeBytes: uploadBlob.size,
        sizeFormatted: formatBytesClient(uploadBlob.size),
        extension: ext,
      })
    }
  }

  for (const [field, url] of Object.entries(primaryUrlByField)) {
    cleanFormData.set(field, url)
  }

  for (const [listField, list] of Object.entries(urlsByListField)) {
    if (list.length > 0) {
      cleanFormData.set(listField, JSON.stringify(list))
    }
  }

  if (uploadedFilesMeta.length > 0) {
    cleanFormData.set('uploaded_files_meta', JSON.stringify(uploadedFilesMeta))
  }

  onProgress?.('Guardando producto en la base de datos...')
  return { formData: cleanFormData }
}

