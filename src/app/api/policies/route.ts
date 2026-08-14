import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query, d1First, d1Run } from '@/lib/d1'
import { generateVerifyCode } from '@/lib/policy-utils'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

/** GET /api/policies — list with pagination + filters (?status=&q=&from=&to=&page=&pageSize=) */
export async function GET(req: NextRequest) {
  try {
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

    if (isD1()) {
      const conditions: string[] = []
      const params: unknown[] = []

      if (status && status !== 'ALL') {
        conditions.push('p.status = ?')
        params.push(status)
      }

      if (q) {
        conditions.push(
          '(p.nombre LIKE ? OR p.apellido LIKE ? OR p.cedula LIKE ? OR p.placa LIKE ? OR p.verifyCode LIKE ? OR p.policyNumber LIKE ?)'
        )
        const pattern = `%${q}%`
        params.push(pattern, pattern, pattern, pattern, pattern, pattern)
      }

      if (from) {
        conditions.push('p.createdAt >= ?')
        params.push(new Date(from).toISOString())
      }
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        conditions.push('p.createdAt <= ?')
        params.push(toDate.toISOString())
      }

      const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const offset = (page - 1) * pageSize

      const [rows, totalRow] = await Promise.all([
        d1Query<Record<string, unknown>>(`
          SELECT p.*, (
            SELECT json_group_array(json_object(
              'id', d.id, 'policyId', d.policyId, 'tipo', d.tipo,
              'fileName', d.fileName, 'filePath', d.filePath,
              'mimeType', d.mimeType, 'size', d.size, 'createdAt', d.createdAt
            ))
            FROM Document d WHERE d.policyId = p.id
          ) as documents
          FROM Policy p
          ${whereSql}
          ORDER BY p.createdAt DESC
          LIMIT ? OFFSET ?
        `, [...params, pageSize, offset]),
        d1First<{ c: number }>(
          `SELECT COUNT(*) as c FROM Policy p ${whereSql}`,
          params
        ),
      ])

      const total = Number(totalRow?.c || 0)
      const policies = rows.map((r) => {
        const docsRaw = r.documents
        delete r.documents
        let documents: unknown[] = []
        if (typeof docsRaw === 'string' && docsRaw) {
          try {
            documents = JSON.parse(docsRaw)
          } catch {
            documents = []
          }
        }
        return { ...r, documents }
      })

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
    } else {
      const { db } = await import('@/lib/db')

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
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/** POST /api/policies — create a new solicitud */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const verifyCode = await generateVerifyCode()

    if (isD1()) {
      // D1 raw SQL insert
      const id = 'pol_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      const now = new Date().toISOString()

      const fields = [
        'id', 'verifyCode', 'status', 'createdAt', 'updatedAt',
        'nombre', 'apellido', 'cedula', 'telefono', 'email',
        'asegNombre', 'asegApellido', 'asegCedula', 'asegEmail',
        'tomNombre', 'tomApellido', 'tomCedula', 'tomEmail',
        'tomFechaNacimiento', 'tomEstadoCivil', 'tomGenero', 'tomTelefono',
        'tomEstado', 'tomMunicipio', 'tomParroquia', 'tomDireccion',
        'placa', 'marca', 'modelo', 'tipoVehiculo', 'ano', 'color',
        'serialCarroceria', 'serialMotor', 'uso', 'cantidadPuestos', 'capacidadCarga',
        'poseeTrailer', 'placaExtranjera',
        'vehicleClassId', 'planId', 'plan', 'prima', 'primaEur', 'primaUsd', 'primaBs',
      ]

      const values = [
        id, verifyCode, 'PENDIENTE', now, now,
        body.nombre || 'Sin Nombre', body.apellido || null, body.cedula || '', body.telefono || null, body.email || null,
        body.asegNombre || null, body.asegApellido || null, body.asegCedula || null, body.asegEmail || null,
        body.tomNombre || null, body.tomApellido || null, body.tomCedula || null, body.tomEmail || null,
        body.tomFechaNacimiento || null, body.tomEstadoCivil || null, body.tomGenero || null, body.tomTelefono || null,
        body.tomEstado || null, body.tomMunicipio || null, body.tomParroquia || null, body.tomDireccion || null,
        body.placa || null, body.marca || null, body.modelo || null, body.tipoVehiculo || null, body.ano || null, body.color || null,
        body.serialCarroceria || null, body.serialMotor || null, body.uso || null, body.cantidadPuestos || null, body.capacidadCarga || null,
        body.poseeTrailer || 'No', body.placaExtranjera || 'No',
        body.vehicleClassId || null, body.planId || null, body.plan || null, body.prima || null, body.primaEur || null, body.primaUsd || null, body.primaBs || null,
      ]

      const placeholders = fields.map(() => '?').join(', ')
      const sql = `INSERT INTO Policy (${fields.join(', ')}) VALUES (${placeholders})`
      await d1Run(sql, values)

      // Log activity
      const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      await d1Run(
        `INSERT INTO ActivityLog (id, policyId, action, description, actor, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [actId, id, 'CREATED', `Solicitud creada por ${body.nombre || ''} ${body.apellido || ''} (cédula ${body.cedula || ''}) con código ${verifyCode}`, body.actor || 'public', now]
      )

      return NextResponse.json({ policy: { id, verifyCode, status: 'PENDIENTE' } }, { status: 201 })
    } else {
      const { db } = await import('@/lib/db')
      const policy = await db.policy.create({
        data: {
          verifyCode,
          nombre: body.nombre?.toString().trim() || 'Sin Nombre',
          apellido: body.apellido?.toString().trim() || null,
          cedula: body.cedula?.toString().trim() || '',
          telefono: body.telefono || null,
          email: body.email || null,
          asegNombre: body.asegNombre || null,
          asegApellido: body.asegApellido || null,
          asegCedula: body.asegCedula || null,
          asegEmail: body.asegEmail || null,
          tomNombre: body.tomNombre || null,
          tomApellido: body.tomApellido || null,
          tomCedula: body.tomCedula || null,
          tomEmail: body.tomEmail || null,
          tomFechaNacimiento: body.tomFechaNacimiento || null,
          tomEstadoCivil: body.tomEstadoCivil || null,
          tomGenero: body.tomGenero || null,
          tomTelefono: body.tomTelefono || null,
          tomEstado: body.tomEstado || null,
          tomMunicipio: body.tomMunicipio || null,
          tomParroquia: body.tomParroquia || null,
          tomDireccion: body.tomDireccion || null,
          tipoVehiculo: body.tipoVehiculo || null,
          marca: body.marca || null,
          modelo: body.modelo || null,
          ano: body.ano || null,
          placa: body.placa || null,
          color: body.color || null,
          serialCarroceria: body.serialCarroceria || null,
          serialMotor: body.serialMotor || null,
          uso: body.uso || null,
          cantidadPuestos: body.cantidadPuestos || null,
          capacidadCarga: body.capacidadCarga || null,
          poseeTrailer: body.poseeTrailer || 'No',
          placaExtranjera: body.placaExtranjera || 'No',
          vehicleClassId: body.vehicleClassId || null,
          planId: body.planId || null,
          plan: body.plan || null,
          prima: body.prima || null,
          primaEur: body.primaEur || null,
          primaUsd: body.primaUsd || null,
          primaBs: body.primaBs || null,
        },
      })
      return NextResponse.json({ policy }, { status: 201 })
    }
  } catch (e) {
    console.error('create policy error', e)
    return NextResponse.json(
      { error: 'No se pudo crear la solicitud.' },
      { status: 500 }
    )
  }
}
