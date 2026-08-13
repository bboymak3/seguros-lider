import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/stats — dashboard counts */
export async function GET(_req: NextRequest) {
  const [total, pendientes, aprobadas, rechazadas, hoy] = await Promise.all([
    db.policy.count(),
    db.policy.count({ where: { status: 'PENDIENTE' } }),
    db.policy.count({ where: { status: 'APROBADA' } }),
    db.policy.count({ where: { status: 'RECHAZADA' } }),
    db.policy.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ])

  return NextResponse.json({
    total,
    pendientes,
    aprobadas,
    rechazadas,
    hoy,
  })
}
