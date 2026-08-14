import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query, d1First, d1Run } from '@/lib/d1'
import { storage } from '@/lib/storage'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id] */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    if (isD1()) {
      const policy = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      const documents = await d1Query<Record<string, unknown>>(
        'SELECT * FROM Document WHERE policyId = ? ORDER BY createdAt ASC',
        [id]
      )
      return NextResponse.json({ policy: { ...policy, documents } })
    } else {
      const { db } = await import('@/lib/db')
      const policy = await db.policy.findUnique({
        where: { id },
        include: { documents: true },
      })
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      return NextResponse.json({ policy })
    }
  } catch (e) {
    console.error('get policy error', e)
    return NextResponse.json({ error: 'No se pudo cargar la póliza' }, { status: 500 })
  }
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
    if (isD1()) {
      const before = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )
      if (!before) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }

      // Build UPDATE statement dynamically from allowed fields
      const setClauses: string[] = []
      const values: unknown[] = []
      for (const [k, v] of Object.entries(allowed)) {
        setClauses.push(`${k} = ?`)
        values.push(v)
      }
      const now = new Date().toISOString()
      setClauses.push('updatedAt = ?')
      values.push(now)
      values.push(id)

      await d1Run(
        `UPDATE Policy SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      )

      // Activity log (inline SQL — logActivity uses Prisma)
      const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      let action = 'UPDATED'
      let description = 'Datos actualizados'
      let metadata: Record<string, unknown> = {}
      if (allowed.status && before.status !== allowed.status) {
        action =
          allowed.status === 'APROBADA'
            ? 'APPROVED'
            : allowed.status === 'RECHAZADA'
              ? 'REJECTED'
              : allowed.status === 'ANULADA'
                ? 'ANULADA'
                : 'STATUS_CHANGED'
        description = `Estado cambiado de "${before.status}" a "${allowed.status}"`
        metadata = { from: before.status, to: allowed.status }
      } else {
        const changedFields = Object.keys(allowed)
        description = `Datos actualizados${
          changedFields.length
            ? ` (${changedFields.length} campo${changedFields.length > 1 ? 's' : ''})`
            : ''
        }`
        metadata = { fields: changedFields }
      }
      await d1Run(
        `INSERT INTO ActivityLog (id, policyId, action, description, actor, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [actId, id, action, description, 'admin', JSON.stringify(metadata), now]
      )

      // Fetch updated policy + documents to return
      const updated = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )
      const documents = await d1Query<Record<string, unknown>>(
        'SELECT * FROM Document WHERE policyId = ? ORDER BY createdAt ASC',
        [id]
      )

      return NextResponse.json({ policy: { ...updated, documents } })
    } else {
      const { db } = await import('@/lib/db')
      const before = await db.policy.findUnique({ where: { id } })
      if (!before) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      const updated = await db.policy.update({
        where: { id },
        data: allowed,
        include: { documents: true },
      })

      // detect status change vs general update
      if (allowed.status && before.status !== allowed.status) {
        await logActivity(
          id,
          allowed.status === 'APROBADA'
            ? 'APPROVED'
            : allowed.status === 'RECHAZADA'
              ? 'REJECTED'
              : allowed.status === 'ANULADA'
                ? 'ANULADA'
                : 'STATUS_CHANGED',
          `Estado cambiado de "${before.status}" a "${allowed.status}"`,
          'admin',
          { from: before.status, to: allowed.status }
        )
      } else {
        const changedFields = Object.keys(allowed)
        await logActivity(
          id,
          'UPDATED',
          `Datos actualizados${changedFields.length ? ` (${changedFields.length} campo${changedFields.length > 1 ? 's' : ''})` : ''}`,
          'admin',
          { fields: changedFields }
        )
      }

      return NextResponse.json({ policy: updated })
    }
  } catch (e) {
    console.error('update error', e)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
}

/** DELETE /api/policies/[id] — remove policy + stored artifacts */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    if (isD1()) {
      const policy = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      const docs = await d1Query<Record<string, unknown>>(
        'SELECT * FROM Document WHERE policyId = ?',
        [id]
      )

      // remove stored files (best-effort — never block the DB delete on storage errors)
      for (const d of docs) {
        try {
          if (d.filePath) await storage.delete(d.filePath as string)
        } catch (e) {
          console.error('storage delete error (doc)', e)
        }
      }
      try {
        if (policy.cedulaDocPath) await storage.delete(policy.cedulaDocPath as string)
      } catch (e) {
        console.error('storage delete error (cedula)', e)
      }
      try {
        if (policy.tituloDocPath) await storage.delete(policy.tituloDocPath as string)
      } catch (e) {
        console.error('storage delete error (titulo)', e)
      }
      try {
        if (policy.pdfPath) await storage.delete(policy.pdfPath as string)
      } catch (e) {
        console.error('storage delete error (pdf)', e)
      }
      try {
        if (policy.qrPath) await storage.delete(policy.qrPath as string)
      } catch (e) {
        console.error('storage delete error (qr)', e)
      }

      // cascade delete
      await d1Run('DELETE FROM Document WHERE policyId = ?', [id])
      await d1Run('DELETE FROM ActivityLog WHERE policyId = ?', [id])
      await d1Run('DELETE FROM Policy WHERE id = ?', [id])

      return NextResponse.json({ ok: true })
    } else {
      const { db } = await import('@/lib/db')
      const policy = await db.policy.findUnique({
        where: { id },
        include: { documents: true },
      })
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }

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
  } catch (e) {
    console.error('delete policy error', e)
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
}
