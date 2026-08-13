import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generatePolicyQr } from '@/lib/qr'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/policies/[id]/qr — returns the QR PNG */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const policy = await db.policy.findUnique({ where: { id } })
  if (!policy) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const { buffer } = await generatePolicyQr(policy.verifyCode)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
