import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * GET /api/activities/export?action=&from=&to=
 * Exports all activities (across all policies) as CSV.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

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

  const activities = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      policy: {
        select: {
          verifyCode: true,
          policyNumber: true,
          nombre: true,
          apellido: true,
          cedula: true,
          status: true,
        },
      },
    },
    take: 5000, // safety cap
  })

  const headers = [
    'Fecha',
    'Acción',
    'Descripción',
    'Actor',
    'Código Verificación',
    'N° Póliza',
    'Tomador',
    'Cédula',
    'Estado Póliza',
  ]

  const rows = activities.map((a) => [
    new Date(a.createdAt).toISOString(),
    a.action,
    a.description,
    a.actor,
    a.policy?.verifyCode || '',
    a.policy?.policyNumber || '',
    a.policy ? `${a.policy.nombre} ${a.policy.apellido || ''}` : '',
    a.policy?.cedula || '',
    a.policy?.status || '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n')

  const bom = '\uFEFF'
  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="actividad-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
