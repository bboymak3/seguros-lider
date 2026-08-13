import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications?limit=10
 * Returns recent global activity (latest actions across all policies) for the
 * admin notification bell.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

  const activities = await db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      policy: {
        select: {
          verifyCode: true,
          policyNumber: true,
          nombre: true,
          apellido: true,
          status: true,
        },
      },
    },
  })

  return NextResponse.json({ activities, count: activities.length })
}
