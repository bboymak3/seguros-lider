import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/plans — list all plans (optionally filter by ?vehicleClassId=) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vehicleClassId = searchParams.get('vehicleClassId')

  const where: Record<string, unknown> = {}
  if (vehicleClassId) where.vehicleClassId = vehicleClassId

  const plans = await db.plan.findMany({
    where,
    orderBy: [{ vehicleClass: { sortOrder: 'asc' } }, { priceEur: 'asc' }],
    include: { vehicleClass: true },
  })

  return NextResponse.json({ plans })
}

/** POST /api/plans — create a new plan (admin) */
export async function POST(req: NextRequest) {
  try {
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
