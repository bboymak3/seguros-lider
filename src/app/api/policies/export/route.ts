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
 * GET /api/policies/export?status=&q=
 * Returns a CSV file of all matching policies.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { nombre: { contains: q } },
      { apellido: { contains: q } },
      { cedula: { contains: q } },
      { placa: { contains: q } },
      { verifyCode: { contains: q } },
      { policyNumber: { contains: q } },
    ]
  }

  const policies = await db.policy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Codigo Verificacion',
    'N° Poliza',
    'Estado',
    'Nombre',
    'Apellido',
    'Tipo Cedula',
    'Cedula',
    'Telefono',
    'Email',
    'Ciudad',
    'Estado',
    'Tipo Vehiculo',
    'Marca',
    'Modelo',
    'Año',
    'Placa',
    'Color',
    'Aseguradora',
    'Plan',
    'Tipo Cobertura',
    'Suma Asegurada',
    'Prima',
    'Deducible',
    'Vigencia Desde',
    'Vigencia Hasta',
    'Frecuencia Pago',
    'Tiene Cedula Doc',
    'Tiene Titulo Doc',
    'Fecha Creacion',
    'Fecha Aprobacion',
  ]

  const rows = policies.map((p) => [
    p.verifyCode,
    p.policyNumber || '',
    p.status,
    p.nombre,
    p.apellido || '',
    p.tipoCedula || '',
    p.cedula,
    p.telefono || '',
    p.email || '',
    p.ciudad || '',
    p.estado || '',
    p.tipoVehiculo || '',
    p.marca || '',
    p.modelo || '',
    p.ano || '',
    p.placa || '',
    p.color || '',
    p.compania || '',
    p.plan || '',
    p.tipoCobertura || '',
    p.sumaAsegurada || '',
    p.prima || '',
    p.deducible || '',
    p.vigenciaDesde || '',
    p.vigenciaHasta || '',
    p.frecuenciaPago || '',
    p.cedulaDocPath ? 'SI' : 'NO',
    p.tituloDocPath ? 'SI' : 'NO',
    new Date(p.createdAt).toISOString(),
    p.aprobadoAt ? new Date(p.aprobadoAt).toISOString() : '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n')

  // BOM for Excel UTF-8 detection
  const bom = '\uFEFF'
  const csvContent = bom + csv

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="polizas-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
