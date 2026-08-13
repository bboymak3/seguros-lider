import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/policies/expiring?days=30
 * Returns approved policies whose vigenciaHasta is within the next `days` days
 * (and not already expired). Sorted by soonest expiry first.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)))

  const now = new Date()
  const limit = new Date(now)
  limit.setDate(limit.getDate() + days)

  const policies = await db.policy.findMany({
    where: {
      status: 'APROBADA',
      vigenciaHasta: { not: null, gte: now.toISOString().slice(0, 10), lte: limit.toISOString().slice(0, 10) },
    },
    orderBy: { vigenciaHasta: 'asc' },
    take: 20,
    select: {
      id: true,
      verifyCode: true,
      policyNumber: true,
      nombre: true,
      apellido: true,
      marca: true,
      modelo: true,
      placa: true,
      vigenciaHasta: true,
      compania: true,
    },
  })

  // Also get already-expired policies (vigenciaHasta < today)
  const expired = await db.policy.findMany({
    where: {
      status: 'APROBADA',
      vigenciaHasta: { not: null, lt: now.toISOString().slice(0, 10) },
    },
    orderBy: { vigenciaHasta: 'desc' },
    take: 20,
    select: {
      id: true,
      verifyCode: true,
      policyNumber: true,
      nombre: true,
      apellido: true,
      marca: true,
      modelo: true,
      placa: true,
      vigenciaHasta: true,
      compania: true,
    },
  })

  return NextResponse.json({ expiring: policies, expired, days })
}
