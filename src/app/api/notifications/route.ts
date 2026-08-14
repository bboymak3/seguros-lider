import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications?limit=10
 * Returns recent global activity (latest actions across all policies) for the
 * admin notification bell.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    if (isD1()) {
      const rows = await d1Query<Record<string, unknown>>(`
        SELECT a.id, a.policyId, a.action, a.description, a.actor, a.metadata, a.createdAt,
          (
            SELECT json_object(
              'verifyCode', p.verifyCode,
              'policyNumber', p.policyNumber,
              'nombre', p.nombre,
              'apellido', p.apellido,
              'status', p.status
            )
            FROM Policy p WHERE p.id = a.policyId
          ) as policy
        FROM ActivityLog a
        ORDER BY a.createdAt DESC
        LIMIT ?
      `, [limit])

      const activities = rows.map((r) => {
        const policyRaw = r.policy
        delete r.policy
        let policy: Record<string, unknown> | null = null
        if (typeof policyRaw === 'string' && policyRaw) {
          try {
            policy = JSON.parse(policyRaw)
          } catch {
            policy = null
          }
        }
        return { ...r, policy }
      })

      return NextResponse.json({ activities, count: activities.length })
    } else {
      const { db } = await import('@/lib/db')

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
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
