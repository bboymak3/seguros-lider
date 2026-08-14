import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query, d1First } from '@/lib/d1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/activities?page=1&pageSize=20&action=&from=&to=
 * Returns all activity across all policies (global feed) with pagination + filters.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
    const action = searchParams.get('action')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (isD1()) {
      const conditions: string[] = []
      const params: unknown[] = []

      if (action && action !== 'ALL') {
        conditions.push('a.action = ?')
        params.push(action)
      }

      if (from) {
        conditions.push('a.createdAt >= ?')
        params.push(new Date(from).toISOString())
      }
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        conditions.push('a.createdAt <= ?')
        params.push(toDate.toISOString())
      }

      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const offset = (page - 1) * pageSize

      const [rows, totalRow] = await Promise.all([
        d1Query<Record<string, unknown>>(`
          SELECT a.id, a.policyId, a.action, a.description, a.actor, a.metadata, a.createdAt,
            (
              SELECT json_object(
                'id', p.id,
                'verifyCode', p.verifyCode,
                'policyNumber', p.policyNumber,
                'nombre', p.nombre,
                'apellido', p.apellido,
                'status', p.status
              )
              FROM Policy p WHERE p.id = a.policyId
            ) as policy
          FROM ActivityLog a
          ${whereSql}
          ORDER BY a.createdAt DESC
          LIMIT ? OFFSET ?
        `, [...params, pageSize, offset]),
        d1First<{ c: number }>(
          `SELECT COUNT(*) as c FROM ActivityLog a ${whereSql}`,
          params
        ),
      ])

      const total = Number(totalRow?.c || 0)
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

      return NextResponse.json({
        activities,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page * pageSize < total,
          hasPrev: page > 1,
        },
      })
    } else {
      const { db } = await import('@/lib/db')

      const where: Record<string, unknown> = {}
      if (action && action !== 'ALL') where.action = action

      if (from || to) {
        const range: Record<string, Date> = {}
        if (from) range.gte = new Date(from)
        if (to) {
          const toDate = new Date(to)
          toDate.setHours(23, 59, 59, 999)
          range.lte = toDate
        }
        where.createdAt = range
      }

      const [activities, total] = await Promise.all([
        db.activityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            policy: {
              select: {
                id: true,
                verifyCode: true,
                policyNumber: true,
                nombre: true,
                apellido: true,
                status: true,
              },
            },
          },
        }),
        db.activityLog.count({ where }),
      ])

      return NextResponse.json({
        activities,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page * pageSize < total,
          hasPrev: page > 1,
        },
      })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
