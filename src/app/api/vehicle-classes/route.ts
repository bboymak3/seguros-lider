import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/vehicle-classes — list all vehicle classes with their plans */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const withPlans = searchParams.get('withPlans') !== 'false'

  const classes = await db.vehicleClass.findMany({
    orderBy: { sortOrder: 'asc' },
    include: withPlans
      ? {
          plans: {
            where: { active: true },
            orderBy: { priceEur: 'asc' },
          },
        }
      : false,
  })

  return NextResponse.json({ vehicleClasses: classes })
}

/** POST /api/vehicle-classes — create a new vehicle class (admin) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await db.vehicleClass.create({
      data: {
        code: body.code,
        name: body.name,
        sortOrder: body.sortOrder ?? 0,
      },
    })
    return NextResponse.json({ vehicleClass: created }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo crear la clase' }, { status: 500 })
  }
}
