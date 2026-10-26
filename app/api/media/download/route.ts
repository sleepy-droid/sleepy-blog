import fs from 'fs'
import path from 'path'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')?.trim()
  const asset = (searchParams.get('asset')?.trim() || 'wav').toLowerCase()

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

  const { data: product } = await productQuery.maybeSingle()
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })
  }

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
  let targetUrl: string | null = null
  switch (asset) {
    case 'mp3':
      targetUrl = product.mp3_url || product.audio_preview_url || product.wav_url
      break
    case 'acapella':
      targetUrl = product.acapella_url
      break
    case 'instrumental':
      targetUrl = product.instrumental_url
      break
    case 'wav':
    default:
      targetUrl = product.wav_url || product.mp3_url || product.audio_preview_url
      break
  }

  if (!targetUrl) {
    return NextResponse.json(
      { error: `El formato solicitado (${asset}) no está disponible para este producto.` },
      { status: 404 }
    )
  }

  // 4. Si es una ruta relativa (ej. /songs/criss-angel/crissangel.wav), intentar:
  //    a) Generar Signed URL desde Supabase Storage (`private-vault` o `public-media`) si existe en la nube
  //    b) Servir el archivo desde `public/` en entorno local / servidor dedicado con cabeceras de descarga
  if (targetUrl.startsWith('/')) {
    const storageKey = targetUrl.replace(/^\/+/, '')
    const ext = path.extname(storageKey) || (asset === 'mp3' ? '.mp3' : '.wav')
    const downloadFilename = `${product.slug || 'sleepyred999'}-${asset}${ext}`

    // Intentar primero desde el archivo local en public/ (rápido y sin latencia en dev/Docker)
    const publicDir = path.resolve(process.cwd(), 'public')
    const localFilePath = path.join(/*turbopackIgnore: true*/ publicDir, ...storageKey.split('/'))

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const fileBuffer = fs.readFileSync(localFilePath)
      const contentType =
        ext.toLowerCase() === '.mp3'
          ? 'audio/mpeg'
          : ext.toLowerCase() === '.wav'
          ? 'audio/wav'
          : 'application/octet-stream'

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
    const bucket = asset === 'mp3' ? 'public-media' : 'private-vault'
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storageKey, 3600, { download: downloadFilename })

    if (signedData?.signedUrl) {
      return NextResponse.redirect(signedData.signedUrl)
    }
  }

  // Si es una URL externa completa
  return NextResponse.redirect(new URL(targetUrl, request.url))
}
