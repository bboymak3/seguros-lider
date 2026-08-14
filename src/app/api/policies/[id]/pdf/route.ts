import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First } from '@/lib/d1'
import { generatePolicyPdf } from '@/lib/pdf'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id]/pdf — generate and stream the PDF */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  try {
    let policyData: Record<string, unknown> | null = null

    if (isD1()) {
      policyData = await d1First<Record<string, unknown>>('SELECT * FROM Policy WHERE id = ?', [id])
    } else {
      const { db } = await import('@/lib/db')
      policyData = await db.policy.findUnique({ where: { id } }) as Record<string, unknown> | null
    }

    if (!policyData) {
      return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    }

    const { bytes } = await generatePolicyPdf(policyData as never)

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="poliza-${(policyData as { verifyCode: string }).verifyCode}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('PDF error:', e)
    return NextResponse.json({ error: 'Error generando PDF: ' + (e as Error).message }, { status: 500 })
  }
}
