import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string; docId: string }> }

/** DELETE /api/policies/[id]/documents/[docId] */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, docId } = await params
  const doc = await db.document.findUnique({ where: { id: docId } })
  if (!doc || doc.policyId !== id) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  await storage.delete(doc.filePath)
  await db.document.delete({ where: { id: docId } })

  // clear mirror fields if this was the canonical cedula / titulo
  const policy = await db.policy.findUnique({ where: { id } })
  if (policy) {
    const patch: Record<string, null> = {}
    if (policy.cedulaDocPath === doc.filePath) {
      patch.cedulaDocPath = null
      patch.cedulaDocName = null
      patch.cedulaDocType = null
    }
    if (policy.tituloDocPath === doc.filePath) {
      patch.tituloDocPath = null
      patch.tituloDocName = null
      patch.tituloDocType = null
    }
    if (Object.keys(patch).length) {
      await db.policy.update({ where: { id }, data: patch })
    }
  }

  await logActivity(
    id,
    'DOCUMENT_DELETED',
    `Documento ${doc.tipo} eliminado: ${doc.fileName}`,
    'admin',
    { docId, tipo: doc.tipo, fileName: doc.fileName }
  )

  return NextResponse.json({ ok: true })
}
