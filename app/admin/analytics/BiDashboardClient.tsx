'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Users,
  Disc3,
  Layers,
  Download,
  Globe,
  Smartphone,
  Sparkles,
  Filter,
  Database,
  ArrowUpRight,
  CheckCircle2,
  Activity,
} from 'lucide-react'
import { formatPrice } from '@/lib/types'
import type {
  BusinessIntelligenceSnapshot,
  ProductBiClassification,
  RfmSegmentName,
} from '@/lib/bi-engine'

interface BiDashboardClientProps {
  snapshot: BusinessIntelligenceSnapshot
}

type ActiveBiTab = 'all' | 'funnel' | 'rfm' | 'stems' | 'taxonomy'

export function BiDashboardClient({ snapshot }: BiDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveBiTab>('all')
  const [classificationFilter, setClassificationFilter] = useState<
    ProductBiClassification | 'ALL'
  >('ALL')
  const [rfmFilter, setRfmFilter] = useState<RfmSegmentName | 'ALL'>('ALL')
  const [copiedSql, setCopiedSql] = useState(false)

  const filteredProducts = useMemo(() => {
    if (classificationFilter === 'ALL') return snapshot.productMatrix
    return snapshot.productMatrix.filter(
      (p) => p.classification === classificationFilter
    )
  }, [snapshot.productMatrix, classificationFilter])

  const filteredRfmUsers = useMemo(() => {
    if (rfmFilter === 'ALL') return snapshot.rfmUsers
    return snapshot.rfmUsers.filter((u) => u.segment === rfmFilter)
  }, [snapshot.rfmUsers, rfmFilter])

  const handleExportCsv = (dataset: 'products' | 'rfm') => {
    let csvContent = ''
    let filename = ''

    if (dataset === 'products') {
      filename = `sleepy_bi_product_matrix_${new Date().toISOString().slice(0, 10)}.csv`
      const headers = [
        'Slug',
        'Lanzamiento',
        'Clasificacion_BI',
        'Precio_USD',
        'Streams',
        'Vistas_Ficha',
        'Intencion_Carrito',
        'Coleccionistas',
        'Descargas_Boveda',
        'Conversion_Pct',
        'Aprobacion_Pct',
        'Ingresos_USD',
      ]
      const rows = snapshot.productMatrix.map((p) => [
        p.slug,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.classification}"`,
        (p.priceCents / 100).toFixed(2),
        p.streams,
        p.productViews,
        p.cartAdds,
        p.buyersCount,
        p.downloadsCount,
        p.streamToBuyPct,
        p.approvalPct,
        (p.revenueCents / 100).toFixed(2),
      ])
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    } else {
      filename = `sleepy_bi_rfm_segments_${new Date().toISOString().slice(0, 10)}.csv`
      const headers = [
        'Username',
        'Nombre',
        'Segmento_RFM',
        'Score_RFM',
        'Recencia_Dias',
        'Frecuencia_Eventos',
        'Compras_Desbloqueadas',
        'Monetario_USD',
        'Perfil_Personalizado',
      ]
      const rows = snapshot.rfmUsers.map((u) => [
        u.username,
        `"${u.displayName.replace(/"/g, '""')}"`,
        `"${u.segment}"`,
        u.rfmCode,
        u.recencyDays,
        u.frequencyCount,
        u.unlockedCount,
        (u.monetaryCents / 100).toFixed(2),
        u.hasCustomizedProfile ? 'SI' : 'NO',
      ])
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopySqlViews = () => {
    const sqlSnippet = `-- Consultas BI directas en Supabase SQL Editor / Metabase / Looker Studio:
SELECT * FROM public.v_bi_silver_classified_events ORDER BY created_at DESC LIMIT 100;
SELECT * FROM public.v_bi_gold_product_funnel ORDER BY estimated_revenue_cents DESC;
SELECT * FROM public.v_bi_gold_rfm_user_segments ORDER BY monetary_cents DESC;
SELECT * FROM public.v_bi_gold_stem_affinity;`
    navigator.clipboard?.writeText(sqlSnippet).then(() => {
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2500)
    })
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Architecture Badge */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950/90 text-red-400 border border-red-800/70">
              <Database className="w-3 h-3" />
              Medallion BI Architecture (Bronze → Silver → Gold)
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              Actualizado: {new Date(snapshot.generatedAtIso).toLocaleTimeString('es-PA')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Business Intelligence & Clasificación de Datos
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl">
            Pila unificada de telemetría de eventos, taxonomía de 4 pilares y modelos analíticos (Embudo Stream-a-Coleccionista, Matriz BCG de Catálogo, Segmentación RFM de Fans y Afinidad de Stems/Pósters 3000×3000).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportCsv('products')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-red-400" />
            CSV Catálogo BI
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv('rfm')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            CSV Segmentos RFM
          </button>
        </div>
      </header>

      {/* Executive KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Ingresos Acumulados (Catálogo)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            {formatPrice(snapshot.kpis.totalRevenueCents, 'USD')}
          </p>
          <p className="text-[11px] text-neutral-400">
            ARPPU:{' '}
            <span className="text-emerald-400 font-mono font-semibold">
              {formatPrice(snapshot.kpis.arppuCents, 'USD')}
            </span>{' '}
            por coleccionista
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Conversión Stream → Compra</span>
            <Sparkles className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            {snapshot.kpis.overallStreamToBuyPct}%
          </p>
          <p className="text-[11px] text-neutral-400">
            <span className="text-white font-semibold">
              {snapshot.kpis.payingCollectorsCount}
            </span>{' '}
            coleccionistas /{' '}
            <span className="text-neutral-300 font-mono">
              {snapshot.kpis.totalStreamsCount}
            </span>{' '}
            streams
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Identidad & Perfiles Vivos</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            {snapshot.kpis.customizedProfilesPct}%
          </p>
          <p className="text-[11px] text-neutral-400">
            Con banner, portada, canción fijada o stickers
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Registros Clasificados (Silver)</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-white">
            {snapshot.kpis.totalClassifiedRecords}
          </p>
          <p className="text-[11px] text-neutral-400">
            En 4 pilares de dominio de negocio
          </p>
        </div>
      </section>

      {/* Model Navigation Pill Bar */}
      <nav
        aria-label="Modelos de Inteligencia de Negocios"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800/80"
      >
        {[
          { id: 'all', label: 'Vista Integral (4 Modelos)', icon: BarChart3 },
          { id: 'funnel', label: '1. Embudo & Matriz de Catálogo', icon: TrendingUp },
          { id: 'rfm', label: '2. Segmentación RFM de Fans', icon: Users },
          { id: 'stems', label: '3. Afinidad de Stems & Pósters', icon: Disc3 },
          { id: 'taxonomy', label: '4. Taxonomía & SQL Medallion', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveBiTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-700 text-white shadow-md shadow-red-950/50'
                  : 'bg-neutral-900/70 text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* =====================================================================
          MODELO 1: EMBUDO STREAM-TO-BUY & MATRIZ BCG DE PRODUCTOS
         ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'funnel') && (
        <section className="bi-containment-panel space-y-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                Modelo BI #1 • Monetization & Release Matrix
              </span>
              <h2
                id="bi-product-matrix-heading"
                className="text-lg font-extrabold text-white mt-0.5"
              >
                Embudo de Conversión (Stream → Coleccionista) y Clasificación BCG
              </h2>
              <p className="text-xs text-neutral-400">
                Como la escucha completa ahora es abierta, este modelo mide qué lanzamientos convierten oyentes gratuitos en dueños de Masters WAV y Pósters 3000×3000.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-neutral-500 mr-1" />
              {(
                [
                  'ALL',
                  '🏆 Cash Cow',
                  '💎 Alta Conversión',
                  '🚀 Viral / Top Stream',
                  '🌱 En Crecimiento',
                ] as const
              ).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setClassificationFilter(cls)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    classificationFilter === cls
                      ? 'bg-red-950 text-red-300 border border-red-700/70'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cls === 'ALL' ? 'Todos' : cls}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Stage Visual Conversion Funnel */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {snapshot.funnelStages.map((st, idx) => (
              <div
                key={st.stage}
                className="rounded-xl border border-neutral-800/90 bg-neutral-950/70 p-3.5 flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-400">
                      {st.stage}
                    </span>
                    {idx > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
                        {st.conversionFromPrevPct}% paso
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {st.label}
                  </p>
                </div>
                <div className="pt-1 border-t border-neutral-900 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold font-mono text-white">
                    {st.count}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    eventos/unid.
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Responsive Product Matrix Table (modern-web-guidance: responsive-table) */}
          <div
            className="bi-table-wrapper rounded-2xl border border-neutral-800 bg-neutral-950/90"
            tabIndex={0}
            role="region"
            aria-labelledby="bi-product-matrix-heading"
          >
            <table
              style={
                {
                  '--label-2': '"Clasificación BI"',
                  '--label-3': '"Precio"',
                  '--label-4': '"Streams"',
                  '--label-5': '"Vistas / Carrito"',
                  '--label-6': '"Coleccionistas"',
                  '--label-7': '"Conversión %"',
                  '--label-8': '"Ingresos"',
                } as React.CSSProperties
              }
            >
              <thead>
                <tr>
                  <th scope="col">Lanzamiento / Producto</th>
                  <th scope="col">Clasificación BI</th>
                  <th scope="col" className="bi-num">
                    Precio
                  </th>
                  <th scope="col" className="bi-num">
                    Streams
                  </th>
                  <th scope="col" className="bi-num">
                    Vistas / Carrito
                  </th>
                  <th scope="col" className="bi-num">
                    Coleccionistas
                  </th>
                  <th scope="col" className="bi-num">
                    Conversión
                  </th>
                  <th scope="col" className="bi-num">
                    Ingresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.slug}>
                    <th scope="row">
                      <div className="flex flex-col">
                        <Link
                          href={`/shop/${prod.slug}`}
                          className="font-bold text-white hover:text-red-400 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{prod.name}</span>
                          <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                        </Link>
                        <span className="text-[10px] font-mono text-neutral-500">
                          /{prod.slug} • Top formato: {prod.topAsset}
                        </span>
                      </div>
                    </th>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-neutral-200 border border-neutral-700">
                        {prod.classification}
                      </span>
                    </td>
                    <td className="bi-num text-neutral-300">
                      {formatPrice(prod.priceCents, 'USD')}
                    </td>
                    <td className="bi-num text-white font-semibold">
                      {prod.streams}
                    </td>
                    <td className="bi-num text-neutral-400">
                      {prod.productViews} / {prod.cartAdds}
                    </td>
                    <td className="bi-num text-emerald-400 font-bold">
                      {prod.buyersCount}{' '}
                      <span className="text-[10px] text-neutral-500 font-normal">
                        ({prod.downloadsCount} desc.)
                      </span>
                    </td>
                    <td className="bi-num">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-red-950/60 text-red-300 border border-red-900/50">
                        {prod.streamToBuyPct}%
                      </span>
                    </td>
                    <td className="bi-num text-emerald-300 font-bold">
                      {formatPrice(prod.revenueCents, 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          MODELO 2: SEGMENTACIÓN RFM DE FANS & COLECCIONISTAS
         ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'rfm') && (
        <section className="bi-containment-panel space-y-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Modelo BI #2 • RFM Fan & Collector Scoring
              </span>
              <h2
                id="bi-rfm-table-heading"
                className="text-lg font-extrabold text-white mt-0.5"
              >
                Segmentación RFM (Recencia, Frecuencia y Valor Monetario)
              </h2>
              <p className="text-xs text-neutral-400">
                Clasifica automáticamente cada cuenta en 5 arquetipos accionables según cuándo interactuaron por última vez (R), cuántos streams/votos/stickers usan (F) y su inversión en catálogo (M).
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  'ALL',
                  '🐋 Coleccionista VIP',
                  '🔥 Superfan Activo',
                  '🎛️ Productor / Stems',
                  '🎧 Oyente Casual',
                  '💤 En Riesgo',
                ] as const
              ).map((seg) => (
                <button
                  key={seg}
                  type="button"
                  onClick={() => setRfmFilter(seg)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    rfmFilter === seg
                      ? 'bg-amber-950 text-amber-300 border border-amber-700/70'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {seg === 'ALL' ? 'Todos los Segmentos' : seg}
                </button>
              ))}
            </div>
          </div>

          {/* RFM Persona Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {snapshot.rfmSegments.map((seg) => (
              <div
                key={seg.segment}
                onClick={() =>
                  setRfmFilter(
                    rfmFilter === seg.segment ? 'ALL' : seg.segment
                  )
                }
                className="rounded-xl border border-neutral-800/90 bg-neutral-950/70 p-3.5 space-y-2 hover:border-amber-700/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    {seg.segment}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {seg.count} ({seg.sharePct}%)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  {seg.description}
                </p>
                <div className="pt-2 border-t border-neutral-900 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Valor del segmento:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatPrice(seg.totalRevenueCents, 'USD')}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-300/90 leading-tight">
                    💡 {seg.recommendedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Responsive RFM User Table */}
          <div
            className="bi-table-wrapper rounded-2xl border border-neutral-800 bg-neutral-950/90"
            tabIndex={0}
            role="region"
            aria-labelledby="bi-rfm-table-heading"
          >
            <table
              style={
                {
                  '--label-2': '"Segmento RFM"',
                  '--label-3': '"Score (R-F-M)"',
                  '--label-4': '"Recencia"',
                  '--label-5': '"Frecuencia"',
                  '--label-6': '"Biblioteca"',
                  '--label-7': '"Valor (LTV)"',
                } as React.CSSProperties
              }
            >
              <thead>
                <tr>
                  <th scope="col">Fan / Usuario</th>
                  <th scope="col">Segmento RFM</th>
                  <th scope="col" className="bi-num">
                    Score (R-F-M)
                  </th>
                  <th scope="col" className="bi-num">
                    Recencia
                  </th>
                  <th scope="col" className="bi-num">
                    Frecuencia
                  </th>
                  <th scope="col" className="bi-num">
                    Biblioteca
                  </th>
                  <th scope="col" className="bi-num">
                    Valor (LTV)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRfmUsers.map((u) => (
                  <tr key={u.userId}>
                    <th scope="row">
                      <div className="flex flex-col">
                        <Link
                          href={`/u/${u.username}`}
                          className="font-bold text-white hover:text-amber-300 transition-colors inline-flex items-center gap-1"
                        >
                          <span>{u.displayName}</span>
                          {u.hasCustomizedProfile && (
                            <span
                              title="Perfil personalizado con arte/stickers"
                              className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800/50"
                            >
                              Perfil Vivo
                            </span>
                          )}
                        </Link>
                        <span className="text-[10px] font-mono text-neutral-500">
                          @{u.username}
                        </span>
                      </div>
                    </th>
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-amber-200 border border-neutral-700">
                        {u.segment}
                      </span>
                    </td>
                    <td className="bi-num">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono text-white">
                        {u.rScore}-{u.fScore}-{u.mScore}
                      </span>
                    </td>
                    <td className="bi-num text-neutral-300">
                      {u.recencyDays === 0
                        ? 'Hoy'
                        : `hace ${u.recencyDays}d`}
                    </td>
                    <td className="bi-num text-white font-semibold">
                      {u.frequencyCount} interacciones
                    </td>
                    <td className="bi-num text-neutral-300">
                      {u.unlockedCount} desbloqueos
                    </td>
                    <td className="bi-num text-emerald-400 font-bold">
                      {formatPrice(u.monetaryCents, 'USD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          MODELO 3: AFINIDAD DE STEMS (WAV / MP3 / ACAPELLA / INSTRUMENTAL) & PÓSTERS 3000×3000
         ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'stems') && (
        <section className="bi-containment-panel space-y-5 rounded-2xl border border-neutral-800/90 bg-neutral-900/30 p-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              Modelo BI #3 • Audio Stem & Visual Asset Affinity
            </span>
            <h2 className="text-lg font-extrabold text-white mt-0.5">
              Afinidad por Formato: Masters WAV, Stems de Producción y Pósters 3000×3000
            </h2>
            <p className="text-xs text-neutral-400">
              Identifica qué activos generan mayor valor percibido dentro de la bóveda digital para orientar próximos lanzamientos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {snapshot.stemAffinity.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-neutral-800/90 bg-neutral-950/80 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-800/50">
                      {item.personaTag}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      {item.sharePct}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-1">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {item.subtitle}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-900">
                  <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                      style={{ width: `${Math.max(8, item.sharePct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Streams: {item.streams}</span>
                    <span className="text-emerald-400 font-semibold">
                      Descargas: {item.downloads}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================================
          MODELO 4: TAXONOMÍA DE 4 PILARES, GEO/DISPOSITIVOS & CONECTOR SQL MEDALLION
         ===================================================================== */}
      {(activeTab === 'all' || activeTab === 'taxonomy') && (
        <section className="bi-containment-panel space-y-6 rounded-2xl border border-neutral-800/90 bg-neutral-900/30 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Modelo BI #4 • Data Classification & Medallion Warehouse
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">
                Taxonomía de Datos (4 Pilares), Dispositivos y Vistas SQL
              </h2>
              <p className="text-xs text-neutral-400">
                Cada evento capturado por <code className="text-neutral-200">lib/telemetry.ts</code> y <code className="text-neutral-200">lib/client-telemetry.ts</code> se etiqueta automáticamente en uno de los 4 pilares de negocio.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopySqlViews}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 hover:bg-emerald-900/80 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {copiedSql
                ? '¡Consultas SQL Copiadas!'
                : 'Copiar Consultas SQL (Looker / Metabase)'}
            </button>
          </div>

          {/* 4 Domain Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {snapshot.pillarTaxonomy.map((pil) => (
              <div
                key={pil.pillar}
                className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-red-400">
                    {pil.pillar}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {pil.count} reg. ({pil.sharePct}%)
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{pil.label}</h3>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  {pil.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {pil.sampleEvents.map((ev) => (
                    <span
                      key={ev}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Geo, Device & Live Stream Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Countries */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Globe className="w-4 h-4 text-red-400" />
                Distribución Geográfica (Edge IP)
              </div>
              <div className="space-y-2">
                {snapshot.topCountries.map((c) => (
                  <div key={c.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-neutral-200">
                        País: {c.label}
                      </span>
                      <span className="font-mono text-neutral-400">
                        {c.count} ({c.sharePct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full bg-red-600 rounded-full"
                        style={{ width: `${Math.max(6, c.sharePct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Split (iOS Lock Screen vs Android vs Desktop) */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Ecosistema de Dispositivos (MediaSession)
              </div>
              <div className="space-y-2">
                {snapshot.deviceSplit.map((d) => (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-200">
                        {d.label}
                      </span>
                      <span className="font-mono text-neutral-400">
                        {d.sharePct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.max(6, d.sharePct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Classified Event Feed */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Flujo de Telemetría en Vivo
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  Últimos eventos
                </span>
              </div>
              {snapshot.recentStream.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  Los nuevos eventos en vivo aparecerán aquí conforme los usuarios reproduzcan o descarguen.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {snapshot.recentStream.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-2 text-[11px] py-1.5 px-2 rounded-lg bg-neutral-900/70 border border-neutral-800/60"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold text-red-400">
                          {ev.eventType}
                        </span>{' '}
                        <span className="text-neutral-300">
                          → {ev.targetLabel}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                        {ev.country} • {ev.device}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

