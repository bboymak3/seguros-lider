import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePolicyPdf } from '@/lib/pdf'
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

  const policy = await db.policy.findUnique({ where: { id } })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

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
