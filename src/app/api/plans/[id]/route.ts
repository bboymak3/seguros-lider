import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** PATCH /api/plans/[id] — update a plan (admin) */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  for (const f of ['name', 'priceEur', 'priceUsd', 'priceBs', 'active', 'vehicleClassId']) {
    if (f in body) allowed[f] = body[f]
  }

  try {
    const updated = await db.plan.update({
      where: { id },
      data: allowed,
      include: { vehicleClass: true },
    })
    return NextResponse.json({ plan: updated })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
}

/** DELETE /api/plans/[id] */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    await db.plan.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
}
