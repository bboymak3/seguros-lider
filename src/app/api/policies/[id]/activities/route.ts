import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id]/activities — audit trail for a policy */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const activities = await db.activityLog.findMany({
    where: { policyId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ activities })
}
