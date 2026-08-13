import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * GET /api/policies/[id]/activities/export?format=csv|json
 * Exports the full audit trail for a policy.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  const [policy, activities] = await Promise.all([
    db.policy.findUnique({
      where: { id },
      select: { verifyCode: true, policyNumber: true, nombre: true, apellido: true },
    }),
    db.activityLog.findMany({
      where: { policyId: id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!policy) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const policyLabel = `${policy.nombre} ${policy.apellido || ''} (${policy.policyNumber || policy.verifyCode})`

  if (format === 'json') {
    return NextResponse.json(
      {
        policy: {
          verifyCode: policy.verifyCode,
          policyNumber: policy.policyNumber,
          nombre: policy.nombre,
          apellido: policy.apellido,
        },
        activities,
        exportedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Disposition': `attachment; filename="historial-${policy.verifyCode}.json"`,
        },
      }
    )
  }

  // CSV format
  const headers = ['Fecha', 'Acción', 'Descripción', 'Actor', 'Metadata']
  const rows = activities.map((a) => [
    new Date(a.createdAt).toISOString(),
    a.action,
    a.description,
    a.actor,
    a.metadata || '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n')

  const bom = '\uFEFF'
  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="historial-${policy.verifyCode}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
