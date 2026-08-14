import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateVerifyCode } from '@/lib/policy-utils'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

/** GET /api/policies — list with pagination + filters (?status=&q=&from=&to=&page=&pageSize=) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
  )

  const where: Record<string, unknown> = {}
  if (status && status !== 'ALL') where.status = status

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

  const [policies, total] = await Promise.all([
    db.policy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.policy.count({ where }),
  ])

  return NextResponse.json({
    policies,
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

/** POST /api/policies — create a new solicitud */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const verifyCode = await generateVerifyCode()

    const policy = await db.policy.create({
      data: {
        verifyCode,
        nombre: body.nombre?.toString().trim() || 'Sin Nombre',
        apellido: body.apellido?.toString().trim() || null,
        cedula: body.cedula?.toString().trim() || '',
        tipoCedula: body.tipoCedula || null,
        fechaNacimiento: body.fechaNacimiento || null,
        nacionalidad: body.nacionalidad || null,
        estadoCivil: body.estadoCivil || null,
        sexo: body.sexo || null,
        telefono: body.telefono || null,
        telefonoAlt: body.telefonoAlt || null,
        email: body.email || null,
        direccion: body.direccion || null,
        ciudad: body.ciudad || null,
        estado: body.estado || null,
        ocupacion: body.ocupacion || null,
        tipoVehiculo: body.tipoVehiculo || null,
        marca: body.marca || null,
        modelo: body.modelo || null,
        ano: body.ano || null,
        placa: body.placa || null,
        color: body.color || null,
        serialCarroceria: body.serialCarroceria || null,
        serialMotor: body.serialMotor || null,
        uso: body.uso || null,
        capacidad: body.capacidad || null,
        clase: body.clase || null,
        tipo: body.tipo || null,
        tipoCobertura: body.tipoCobertura || null,
        compania: body.compania || null,
        plan: body.plan || null,
        prima: body.prima || null,
        sumaAsegurada: body.sumaAsegurada || null,
        deducible: body.deducible || null,
        vigenciaDesde: body.vigenciaDesde || null,
        vigenciaHasta: body.vigenciaHasta || null,
        frecuenciaPago: body.frecuenciaPago || null,
        notes: body.notes || null,
      },
    })

    await logActivity(
      policy.id,
      'CREATED',
      `Solicitud creada por ${policy.nombre} ${policy.apellido || ''} (cédula ${policy.cedula}) con código ${policy.verifyCode}`,
      body.actor || 'public'
    )

    return NextResponse.json({ policy }, { status: 201 })
  } catch (e) {
    console.error('create policy error', e)
    return NextResponse.json(
      { error: 'No se pudo crear la solicitud.' },
      { status: 500 }
    )
  }
}
