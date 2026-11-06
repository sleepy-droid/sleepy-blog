import fs from 'fs'
import path from 'path'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hydrateProductWithFolderAssets } from '@/lib/product-files'
import { normalizeMediaUrl } from '@/lib/utils'
import type { Product } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')?.trim()
  const asset = (searchParams.get('asset')?.trim() || 'wav').toLowerCase()
  const requestedFile = searchParams.get('file')?.trim() || null

  if (!productId) {
    return NextResponse.json({ error: 'productId es obligatorio.' }, { status: 400 })
  }

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json(
      { error: 'Debes iniciar sesión para descargar archivos de tu biblioteca.' },
      { status: 401 }
    )
  }

  const supabase = await createClient()

  // 1. Verificar el producto en la base de datos
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
  let productQuery = supabase.from('products').select('*')
  if (isUUID) {
    productQuery = productQuery.or(`id.eq.${productId},slug.eq.${productId}`)
  } else {
    productQuery = productQuery.eq('slug', productId)
  }

  const { data: rawProduct } = await productQuery.maybeSingle()
  if (!rawProduct) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })
  }
  const product = hydrateProductWithFolderAssets(rawProduct as Product)

  // 2. Verificar titularidad (Entitlement Check): Admin o propietario en library_items / orders
  let isEntitled = currentUser.isAdmin

  if (!isEntitled) {
    const { data: libItem } = await supabase
      .from('library_items')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('product_id', product.id)
      .maybeSingle()

    if (libItem) {
      isEntitled = true
    } else {
      const { data: orderCheck } = await supabase
        .from('order_items')
        .select('id, orders!inner(user_id, status)')
        .eq('product_id', product.id)
        .eq('orders.user_id', currentUser.id)
        .maybeSingle()

      if (orderCheck) {
        isEntitled = true
      }
    }
  }

  if (!isEntitled) {
    return NextResponse.json(
      { error: 'No posees licencia de descarga para este lanzamiento en tu biblioteca.' },
      { status: 403 }
    )
  }

  // 3. Seleccionar el archivo solicitado según el tipo de pista (wav, mp3, acapella, instrumental)
  //    o el archivo específico dentro de un álbum multi-pista (`?file=<nombre.wav>`)
  let targetUrl: string | null = null

  if (requestedFile) {
    const safeFileName = path.basename(requestedFile)
    const folderStats = product.folder_stats
    const matchedLocal = folderStats?.files.find(
      (f) => f.name.toLowerCase() === safeFileName.toLowerCase()
    )
    if (matchedLocal && matchedLocal.publicUrl) {
      targetUrl = matchedLocal.publicUrl
    } else if (product.storage_folder_path) {
      const cleanFolder = product.storage_folder_path.replace(/^\/+|\/+$/g, '')
      targetUrl = `/${cleanFolder}/${safeFileName}`
    } else if (product.slug) {
      targetUrl = `/songs/${product.slug}/${safeFileName}`
    }
  }

  if (!targetUrl) {
    const coverFile = (product.folder_stats?.files || []).find((f) =>
      ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(
        f.extension.toLowerCase()
      )
    )

    switch (asset) {
      case 'cover':
      case 'poster':
      case 'artwork':
        targetUrl =
          coverFile?.publicUrl || product.thumbnail_url || null
        break
      case 'mp3':
        targetUrl = product.mp3_url || product.audio_preview_url || product.wav_url || null
        break
      case 'acapella':
        targetUrl = product.acapella_url || null
        break
      case 'instrumental':
        targetUrl = product.instrumental_url || null
        break
      case 'wav':
      default:
        targetUrl = product.wav_url || product.mp3_url || product.audio_preview_url || null
        break
    }
  }

  targetUrl = normalizeMediaUrl(targetUrl) || null

  if (!targetUrl) {
    return NextResponse.json(
      { error: `El formato solicitado (${asset}) no está disponible para este producto.` },
      { status: 404 }
    )
  }

  const isCoverAsset =
    asset === 'cover' || asset === 'poster' || asset === 'artwork'

  const getMimeTypeForExt = (extStr: string) => {
    switch (extStr.toLowerCase()) {
      case '.mp3':
        return 'audio/mpeg'
      case '.wav':
        return 'audio/wav'
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg'
      case '.png':
        return 'image/png'
      case '.webp':
        return 'image/webp'
      case '.avif':
        return 'image/avif'
      case '.svg':
        return 'image/svg+xml'
      default:
        return 'application/octet-stream'
    }
  }

  // 4. Si es una ruta relativa (ej. /songs/criss-angel/crissangel.wav o .jpg), intentar:
  //    a) Servir el archivo desde `public/` en entorno local / servidor dedicado con cabeceras de descarga
  //    b) Generar Signed URL desde Supabase Storage (`public-media` o `private-vault`) si existe en la nube
  //    c) Descargar desde el propio CDN estático de la app y devolver con Content-Disposition attachment
  if (targetUrl.startsWith('/')) {
    const storageKey = targetUrl.replace(/^\/+/, '')
    const defaultExt = isCoverAsset ? '.jpg' : asset === 'mp3' ? '.mp3' : '.wav'
    const ext = path.extname(storageKey) || defaultExt
    const baseFileName = requestedFile
      ? path.basename(requestedFile, path.extname(requestedFile))
      : isCoverAsset
        ? `${product.slug || 'sleepyred999'}-poster-3000x3000`
        : `${product.slug || 'sleepyred999'}-${asset}`
    const downloadFilename = `${baseFileName}${ext}`

    // Intentar primero desde el archivo local en public/
    const publicDir = path.resolve(process.cwd(), 'public')
    const localFilePath = path.join(/*turbopackIgnore: true*/ publicDir, ...storageKey.split('/'))

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const fileBuffer = fs.readFileSync(localFilePath)
      const contentType = getMimeTypeForExt(ext)

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${downloadFilename}"`,
          'Content-Length': String(fileBuffer.byteLength),
          'Cache-Control': 'private, no-store',
        },
      })
    }

    // Si no está en disco local (ej. producción en Vercel), firmar URL temporal en Supabase Storage
    for (const bucket of ['public-media', 'private-vault'] as const) {
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storageKey, 3600, { download: downloadFilename })

      if (signedData?.signedUrl) {
        return NextResponse.redirect(signedData.signedUrl)
      }
    }

    // Fallback: obtener desde la URL pública estática de Vercel y forzar cabecera de descarga
    try {
      const staticAssetUrl = new URL(targetUrl, request.url)
      const fetched = await fetch(staticAssetUrl.toString())
      if (fetched.ok) {
        const arrBuf = await fetched.arrayBuffer()
        return new NextResponse(arrBuf, {
          status: 200,
          headers: {
            'Content-Type':
              fetched.headers.get('content-type') || getMimeTypeForExt(ext),
            'Content-Disposition': `attachment; filename="${downloadFilename}"`,
            'Content-Length': String(arrBuf.byteLength),
            'Cache-Control': 'private, no-store',
          },
        })
      }
    } catch {
      // Continuar a redirección directa
    }
  }

  // Si es una URL externa completa (ej. Supabase Storage CDN https://*.supabase.co/storage/v1/object/public/...)
  const redirectUrl = new URL(targetUrl, request.url)
  const defaultExt = isCoverAsset ? '.jpg' : asset === 'mp3' ? '.mp3' : '.wav'
  const ext = path.extname(redirectUrl.pathname) || defaultExt
  const baseFileName = requestedFile
    ? path.basename(requestedFile, path.extname(requestedFile))
    : isCoverAsset
      ? `${product.slug || 'sleepyred999'}-poster-3000x3000`
      : `${product.slug || 'sleepyred999'}-${asset}`
  const downloadFilename = `${baseFileName}${ext}`

  if (
    redirectUrl.hostname.endsWith('.supabase.co') &&
    !redirectUrl.searchParams.has('download')
  ) {
    redirectUrl.searchParams.set('download', downloadFilename)
  }
  return NextResponse.redirect(redirectUrl)
}
