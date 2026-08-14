import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePolicyPdf } from '@/lib/pdf'
import { storage } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id]/pdf — generate (if needed) and stream the PDF */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const policy = await db.policy.findUnique({ where: { id } })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  // Always regenerate to reflect latest data
  try {
    const { storageKey } = await generatePolicyPdf(policy as never)
    await db.policy.update({ where: { id }, data: { pdfPath: storageKey } })
    const buffer = await storage.get(storageKey)
    if (!buffer) {
      return NextResponse.json({ error: 'PDF no disponible' }, { status: 500 })
    }
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="poliza-${policy.verifyCode}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('pdf stream error', e)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}
