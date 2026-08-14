import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { validateDocFile, safeFileName } from '@/lib/policy-utils'
import { logActivity } from '@/lib/activity'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * POST /api/policies/[id]/documents  (multipart/form-data)
 * field: file, field: tipo (CEDULA | TITULO | OTRO)
 *
 * Stores the file under bucket key:
 *   my-emdash-media/seguros/{verifyCode}/{tipo}/{filename}
 *
 * For CEDULA / TITULO we also mirror the path onto the Policy row so the
 * admin panel can quickly resolve the "main" documents.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const policy = await db.policy.findUnique({ where: { id } })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const tipo = (form.get('tipo') as string) || 'OTRO'

  if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })
  const err = validateDocFile(file)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const fileName = safeFileName(file.name)
  const subfolder = tipo.toLowerCase()
  const key = storage.keyFor(policy.verifyCode, fileName, subfolder)
  const stored = await storage.put(key, buf, file.type)

  const doc = await db.document.create({
    data: {
      policyId: id,
      tipo: tipo.toUpperCase(),
      fileName,
      filePath: stored.key,
      mimeType: file.type,
      size: file.size,
    },
  })

  // mirror onto policy row for the two canonical docs
  const patch: Record<string, string> = {}
  if (tipo.toUpperCase() === 'CEDULA') {
    patch.cedulaDocPath = stored.key
    patch.cedulaDocName = fileName
    patch.cedulaDocType = file.type
  } else if (tipo.toUpperCase() === 'TITULO') {
    patch.tituloDocPath = stored.key
    patch.tituloDocName = fileName
    patch.tituloDocType = file.type
  }
  if (Object.keys(patch).length) {
    await db.policy.update({ where: { id }, data: patch })
  }

  await logActivity(
    id,
    'DOCUMENT_UPLOADED',
    `Documento ${tipo.toUpperCase()} adjuntado: ${fileName}`,
    'admin',
    { tipo, fileName, mimeType: file.type, size: file.size }
  )

  return NextResponse.json({ document: doc }, { status: 201 })
}
