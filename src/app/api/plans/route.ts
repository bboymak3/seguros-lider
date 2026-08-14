import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

/** GET /api/plans — list all plans (optionally filter by ?vehicleClassId=) */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleClassId = searchParams.get('vehicleClassId')

    if (isD1()) {
      let sql = `
        SELECT p.id, p.externalId, p.name, p.vehicleClassId, p.priceEur, p.priceUsd,
               p.priceBs, p.active, p.createdAt, p.updatedAt,
               vc.id as vc_id, vc.code as vc_code, vc.name as vc_name,
               vc.sortOrder as vc_sortOrder, vc.createdAt as vc_createdAt, vc.updatedAt as vc_updatedAt
        FROM Plan p
        LEFT JOIN VehicleClass vc ON vc.id = p.vehicleClassId
      `
      const params: unknown[] = []
      if (vehicleClassId) {
        sql += ' WHERE p.vehicleClassId = ?'
        params.push(vehicleClassId)
      }
      sql += ' ORDER BY vc.sortOrder ASC, CAST(p.priceEur AS REAL) ASC'

      const rows = await d1Query<Record<string, unknown>>(sql, params)
      const plans = rows.map((r) => {
        const vehicleClass = r.vc_id
          ? {
              id: r.vc_id,
              code: r.vc_code,
              name: r.vc_name,
              sortOrder: r.vc_sortOrder,
              createdAt: r.vc_createdAt,
              updatedAt: r.vc_updatedAt,
            }
          : null
        const plan: Record<string, unknown> = {
          id: r.id,
          externalId: r.externalId,
          name: r.name,
          vehicleClassId: r.vehicleClassId,
          priceEur: r.priceEur,
          priceUsd: r.priceUsd,
          priceBs: r.priceBs,
          active: r.active === 1 || r.active === true,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }
        return { ...plan, vehicleClass }
      })

      return NextResponse.json({ plans })
    } else {
      const { db } = await import('@/lib/db')

      const where: Record<string, unknown> = {}
      if (vehicleClassId) where.vehicleClassId = vehicleClassId

      const plans = await db.plan.findMany({
        where,
        orderBy: [{ vehicleClass: { sortOrder: 'asc' } }, { priceEur: 'asc' }],
        include: { vehicleClass: true },
      })

      return NextResponse.json({ plans })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/** POST /api/plans — create a new plan (admin) */
export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const created = await db.plan.create({
      data: {
        externalId: body.externalId,
        name: body.name,
        vehicleClassId: body.vehicleClassId,
        priceEur: body.priceEur,
        priceUsd: body.priceUsd,
        priceBs: body.priceBs,
        active: body.active ?? true,
      },
      include: { vehicleClass: true },
    })
    return NextResponse.json({ plan: created }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo crear el plan' }, { status: 500 })
  }
}
