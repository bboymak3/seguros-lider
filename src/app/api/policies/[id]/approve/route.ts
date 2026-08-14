import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First, d1Run } from '@/lib/d1'
import { nextPolicyNumber } from '@/lib/policy-utils'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** POST /api/policies/[id]/approve — approve + assign policy number + generate PDF */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  let body: { policyNumber?: string; vigenciaDesde?: string; vigenciaHasta?: string; notes?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* empty body is fine */
  }

  try {
    if (isD1()) {
      const policy = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }

      const policyNumber =
        body.policyNumber?.trim() ||
        (policy.policyNumber as string | undefined) ||
        (await nextPolicyNumber())

      const vigenciaDesde =
        body.vigenciaDesde || (policy.vigenciaDesde as string | null) || null
      const vigenciaHasta =
        body.vigenciaHasta || (policy.vigenciaHasta as string | null) || null
      const notes = body.notes ?? (policy.notes as string | null) ?? null
      const now = new Date().toISOString()

      await d1Run(
        `UPDATE Policy SET status = ?, policyNumber = ?, aprobadoAt = ?, aprobadoPor = ?, vigenciaDesde = ?, vigenciaHasta = ?, notes = ?, updatedAt = ? WHERE id = ?`,
        ['APROBADA', policyNumber, now, 'admin', vigenciaDesde, vigenciaHasta, notes, now, id]
      )

      // Activity log for the approval (inline SQL — logActivity uses Prisma)
      const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
      await d1Run(
        `INSERT INTO ActivityLog (id, policyId, action, description, actor, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          actId,
          id,
          'APPROVED',
          `Póliza aprobada con N° ${policyNumber}`,
          'admin',
          JSON.stringify({ policyNumber, previousStatus: policy.status }),
          now,
        ]
      )

      // NOTE: PDF + QR generation is intentionally skipped on D1 for now
      // (it uses the storage layer which is being migrated separately to R2).

      const updated = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE id = ?',
        [id]
      )

      return NextResponse.json({ policy: updated })
    } else {
      const { db } = await import('@/lib/db')
      const { generatePolicyPdf } = await import('@/lib/pdf')

      const policy = await db.policy.findUnique({ where: { id } })
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }

      const policyNumber =
        body.policyNumber?.trim() ||
        policy.policyNumber ||
        (await nextPolicyNumber())

      const updated = await db.policy.update({
        where: { id },
        data: {
          status: 'APROBADA',
          policyNumber,
          aprobadoAt: new Date(),
          aprobadoPor: 'admin',
          vigenciaDesde: body.vigenciaDesde || policy.vigenciaDesde,
          vigenciaHasta: body.vigenciaHasta || policy.vigenciaHasta,
          notes: body.notes ?? policy.notes,
        },
      })

      // Regenerate the certificate PDF (now with APROBADA status + policy number)
      try {
        const { storageKey, qrUrl } = await generatePolicyPdf(updated as never)
        await db.policy.update({
          where: { id },
          data: {
            pdfPath: storageKey,
            qrPath: qrUrl,
          },
        })
        await logActivity(id, 'PDF_GENERATED', 'Certificado PDF generado tras aprobación', 'admin')
      } catch (e) {
        console.error('pdf gen error', e)
      }

      await logActivity(
        id,
        'APPROVED',
        `Póliza aprobada con N° ${policyNumber}`,
        'admin',
        { policyNumber, previousStatus: policy.status }
      )

      return NextResponse.json({ policy: updated })
    }
  } catch (e) {
    console.error('approve error', e)
    return NextResponse.json({ error: 'No se pudo aprobar la póliza' }, { status: 500 })
  }
}
