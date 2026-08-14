import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    if (isD1()) {
      const classes = await d1Query(`
        SELECT vc.id, vc.code, vc.name, vc.sortOrder,
          (SELECT json_group_array(json_object(
            'id', p.id, 'externalId', p.externalId, 'name', p.name,
            'priceEur', p.priceEur, 'priceUsd', p.priceUsd, 'priceBs', p.priceBs,
            'active', p.active
          ))
          FROM Plan p WHERE p.vehicleClassId = vc.id AND p.active = 1
          ORDER BY CAST(p.priceEur AS REAL) ASC) as plans
        FROM VehicleClass vc
        ORDER BY vc.sortOrder ASC
      `)
      const result = classes.map((c: Record<string, unknown>) => ({
        ...c,
        plans: typeof c.plans === 'string' ? JSON.parse(c.plans as string) : []
      }))
      return NextResponse.json({ vehicleClasses: result })
    } else {
      const { db } = await import('@/lib/db')
      const classes = await db.vehicleClass.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { plans: { where: { active: true }, orderBy: { priceEur: 'asc' } } },
      })
      return NextResponse.json({ vehicleClasses: classes })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const body = await req.json()
    const created = await db.vehicleClass.create({
      data: { code: body.code, name: body.name, sortOrder: body.sortOrder ?? 0 },
    })
    return NextResponse.json({ vehicleClass: created }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo crear la clase' }, { status: 500 })
  }
}
