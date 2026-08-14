import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/policies/verify?code=XXXXXX — public lookup by verify code */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = (searchParams.get('code') || '').trim()
  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  const policy = await db.policy.findUnique({
    where: { verifyCode: code },
    include: { documents: true },
  })
  if (!policy) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }
  return NextResponse.json({ policy })
}
