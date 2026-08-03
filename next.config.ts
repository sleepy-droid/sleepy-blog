import type { NextConfig } from "next";

/**
 * CONFIGURACIÓN DE RENDIMIENTO Y OPTIMIZACIÓN DE NEXT.JS:
 * 1. formats: ['image/avif', 'image/webp'] -> Genera formatos de imagen ultraligeros de última generación.
 *    AVIF y WebP reducen el tamaño de las imágenes hasta en un 50-70% en comparación con JPEG/PNG tradicionales,
 *    eliminando drásticamente el comportamiento lento/pesado del sitio web.
 * 2. minimumCacheTTL: 2592000 -> Establece un tiempo de vida en caché de 30 días en el servidor para evitar
 *    re-procesamientos costosos en el hilo del servidor.
 * 3. reactStrictMode: true -> Activa verificaciones estrictas de ciclo de vida en React para evitar fugas de memoria.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 días en segundos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i1.sndcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.sndcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
