import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First, d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

/** GET /api/policies/verify?code=XXXXXX — public lookup by verify code */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = (searchParams.get('code') || '').trim()
    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    if (isD1()) {
      const policy = await d1First<Record<string, unknown>>(
        'SELECT * FROM Policy WHERE verifyCode = ?',
        [code]
      )
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      const documents = await d1Query(
        'SELECT id, policyId, tipo, fileName, filePath, mimeType, size, createdAt FROM Document WHERE policyId = ?',
        [policy.id]
      )
      return NextResponse.json({ policy: { ...policy, documents } })
    } else {
      const { db } = await import('@/lib/db')

      const policy = await db.policy.findUnique({
        where: { verifyCode: code },
        include: { documents: true },
      })
      if (!policy) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
      }
      return NextResponse.json({ policy })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
