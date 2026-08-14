import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { generatePolicyPdf } from '@/lib/pdf'
import { nextPolicyNumber } from '@/lib/policy-utils'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

/**
 * POST /api/policies/bulk
 * Body: { action: 'approve' | 'reject' | 'delete' | 'anular', ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body.action as string
    const ids = (body.ids as string[]) || []

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No se seleccionaron pólizas' }, { status: 400 })
    }

    if (!['approve', 'reject', 'delete', 'anular'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    if (action === 'delete') {
      const policies = await db.policy.findMany({
        where: { id: { in: ids } },
        include: { documents: true },
      })
      for (const p of policies) {
        for (const d of p.documents) await storage.delete(d.filePath)
        if (p.cedulaDocPath) await storage.delete(p.cedulaDocPath)
        if (p.tituloDocPath) await storage.delete(p.tituloDocPath)
        if (p.pdfPath) await storage.delete(p.pdfPath)
        if (p.qrPath) await storage.delete(p.qrPath)
      }
      await db.policy.deleteMany({ where: { id: { in: ids } } })
      return NextResponse.json({ ok: true, affected: ids.length })
    }

    if (action === 'approve') {
      // approve sequentially so policy numbers stay sequential
      let count = 0
      for (const id of ids) {
        const policy = await db.policy.findUnique({ where: { id } })
        if (!policy || policy.status === 'APROBADA') continue
        const policyNumber = policy.policyNumber || (await nextPolicyNumber())
        const updated = await db.policy.update({
          where: { id },
          data: {
            status: 'APROBADA',
            policyNumber,
            aprobadoAt: new Date(),
            aprobadoPor: 'admin',
          },
        })
        try {
          const { storageKey, qrUrl } = await generatePolicyPdf(updated as never)
          await db.policy.update({
            where: { id },
            data: { pdfPath: storageKey, qrPath: qrUrl },
          })
          await logActivity(id, 'PDF_GENERATED', 'Certificado PDF generado (aprobación masiva)', 'admin')
        } catch (e) {
          console.error('bulk pdf error', e)
        }
        await logActivity(id, 'APPROVED', `Póliza aprobada masivamente con N° ${policyNumber}`, 'admin')
        count++
      }
      return NextResponse.json({ ok: true, affected: count })
    }

    if (action === 'reject') {
      await db.policy.updateMany({
        where: { id: { in: ids } },
        data: { status: 'RECHAZADA' },
      })
      for (const id of ids) {
        await logActivity(id, 'REJECTED', 'Solicitud rechazada masivamente', 'admin')
      }
      return NextResponse.json({ ok: true, affected: ids.length })
    }

    if (action === 'anular') {
      await db.policy.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ANULADA' },
      })
      for (const id of ids) {
        await logActivity(id, 'ANULADA', 'Póliza anulada masivamente', 'admin')
      }
      return NextResponse.json({ ok: true, affected: ids.length })
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
  } catch (e) {
    console.error('bulk error', e)
    return NextResponse.json({ error: 'Error en acción masiva' }, { status: 500 })
  }
}
