import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id] */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const policy = await db.policy.findUnique({
    where: { id },
    include: { documents: true },
  })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json({ policy })
}

/** PATCH /api/policies/[id] — admin updates any field(s) */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()

  const allowed: Record<string, unknown> = {}
  const fields = [
    'nombre', 'apellido', 'cedula', 'tipoCedula', 'fechaNacimiento',
    'nacionalidad', 'estadoCivil', 'sexo', 'telefono', 'telefonoAlt',
    'email', 'direccion', 'ciudad', 'estado', 'ocupacion',
    'tipoVehiculo', 'marca', 'modelo', 'ano', 'placa', 'color',
    'serialCarroceria', 'serialMotor', 'uso', 'capacidad', 'clase', 'tipo',
    'tipoCobertura', 'compania', 'plan', 'prima', 'sumaAsegurada',
    'deducible', 'vigenciaDesde', 'vigenciaHasta', 'frecuenciaPago',
    'policyNumber', 'status', 'notes',
    'cedulaDocPath', 'cedulaDocName', 'cedulaDocType',
    'tituloDocPath', 'tituloDocName', 'tituloDocType',
  ]
  for (const f of fields) {
    if (f in body) allowed[f] = body[f] === '' ? null : body[f]
  }

  try {
    const updated = await db.policy.update({
      where: { id },
      data: allowed,
      include: { documents: true },
    })
    return NextResponse.json({ policy: updated })
  } catch (e) {
    console.error('update error', e)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
}

/** DELETE /api/policies/[id] — remove policy + stored artifacts */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const policy = await db.policy.findUnique({
    where: { id },
    include: { documents: true },
  })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  // remove stored files
  for (const d of policy.documents) {
    await storage.delete(d.filePath)
  }
  if (policy.cedulaDocPath) await storage.delete(policy.cedulaDocPath)
  if (policy.tituloDocPath) await storage.delete(policy.tituloDocPath)
  if (policy.pdfPath) await storage.delete(policy.pdfPath)
  if (policy.qrPath) await storage.delete(policy.qrPath)

  await db.policy.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
