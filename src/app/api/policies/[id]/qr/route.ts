import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First } from '@/lib/d1'
import { generatePolicyQr } from '@/lib/qr'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id]/qr — returns the QR PNG */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  try {
    let verifyCode = ''
    if (isD1()) {
      const row = await d1First<{ verifyCode: string }>('SELECT verifyCode FROM Policy WHERE id = ?', [id])
      if (!row) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      verifyCode = row.verifyCode
    } else {
      const { db } = await import('@/lib/db')
      const policy = await db.policy.findUnique({ where: { id }, select: { verifyCode: true } })
      if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      verifyCode = policy.verifyCode
    }

    const { buffer } = await generatePolicyQr(verifyCode)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('QR error:', e)
    return NextResponse.json({ error: 'Error generando QR: ' + (e as Error).message }, { status: 500 })
  }
}
