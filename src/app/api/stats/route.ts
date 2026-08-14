import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stats — dashboard counts + chart data
 * Returns:
 *  - counts (total, pendientes, aprobadas, rechazadas, hoy)
 *  - trends (today vs yesterday for delta indicators)
 *  - timeseries (policies per day for last 14 days)
 *  - statusDistribution (pie data)
 *  - topBrands (bar data)
 *  - topEstados (geographic distribution)
 */
export async function GET(_req: NextRequest) {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const [
    total,
    pendientes,
    aprobadas,
    rechazadas,
    anuladas,
    hoy,
    ayer,
    aprobadasHoy,
    withDocs,
  ] = await Promise.all([
    db.policy.count(),
    db.policy.count({ where: { status: 'PENDIENTE' } }),
    db.policy.count({ where: { status: 'APROBADA' } }),
    db.policy.count({ where: { status: 'RECHAZADA' } }),
    db.policy.count({ where: { status: 'ANULADA' } }),
    db.policy.count({ where: { createdAt: { gte: startOfToday } } }),
    db.policy.count({
      where: { createdAt: { gte: startOfYesterday, lt: startOfToday } },
    }),
    db.policy.count({
      where: { aprobadoAt: { gte: startOfToday } },
    }),
    db.policy.count({ where: { NOT: { cedulaDocPath: null } } }),
  ])

  // Timeseries: last 14 days
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
  fourteenDaysAgo.setHours(0, 0, 0, 0)

  const recentPolicies = await db.policy.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true, status: true, marca: true, estado: true, tipoVehiculo: true },
  })

  const timeseries: { date: string; label: string; total: number; aprobadas: number; pendientes: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const dayPolicies = recentPolicies.filter((p) => p.createdAt >= d && p.createdAt < next)
    timeseries.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }),
      total: dayPolicies.length,
      aprobadas: dayPolicies.filter((p) => p.status === 'APROBADA').length,
      pendientes: dayPolicies.filter((p) => p.status === 'PENDIENTE').length,
    })
  }

  // Status distribution
  const statusDistribution = [
    { name: 'Aprobadas', value: aprobadas, color: '#10b981' },
    { name: 'Pendientes', value: pendientes, color: '#f59e0b' },
    { name: 'Rechazadas', value: rechazadas, color: '#ef4444' },
    { name: 'Anuladas', value: anuladas, color: '#6b7280' },
  ].filter((s) => s.value > 0)

  // Top vehicle brands
  const brandCounts = new Map<string, number>()
  for (const p of recentPolicies) {
    if (p.marca) {
      const b = p.marca.trim()
      brandCounts.set(b, (brandCounts.get(b) || 0) + 1)
    }
  }
  // also count older for richer data
  const allBrands = await db.policy.findMany({
    where: { marca: { not: null } },
    select: { marca: true },
  })
  const brandCountsAll = new Map<string, number>()
  for (const p of allBrands) {
    if (p.marca) {
      const b = p.marca.trim()
      brandCountsAll.set(b, (brandCountsAll.get(b) || 0) + 1)
    }
  }
  const topBrands = Array.from(brandCountsAll.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Top estados (geographic)
  const allEstados = await db.policy.findMany({
    where: { estado: { not: null } },
    select: { estado: true },
  })
  const estadoCounts = new Map<string, number>()
  for (const p of allEstados) {
    if (p.estado) {
      const e = p.estado.trim()
      estadoCounts.set(e, (estadoCounts.get(e) || 0) + 1)
    }
  }
  const topEstados = Array.from(estadoCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Vehicle type distribution
  const allTipos = await db.policy.findMany({
    where: { tipoVehiculo: { not: null } },
    select: { tipoVehiculo: true },
  })
  const tipoCounts = new Map<string, number>()
  for (const p of allTipos) {
    if (p.tipoVehiculo) {
      const t = p.tipoVehiculo.trim()
      tipoCounts.set(t, (tipoCounts.get(t) || 0) + 1)
    }
  }
  const tipoDistribution = Array.from(tipoCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return NextResponse.json({
    total,
    pendientes,
    aprobadas,
    rechazadas,
    anuladas,
    hoy,
    ayer,
    aprobadasHoy,
    withDocs,
    // delta = today - yesterday (for trend arrows)
    deltaHoy: hoy - ayer,
    deltaPercent: ayer > 0 ? Math.round(((hoy - ayer) / ayer) * 100) : hoy > 0 ? 100 : 0,
    timeseries,
    statusDistribution,
    topBrands,
    topEstados,
    tipoDistribution,
  })
}
