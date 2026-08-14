import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/policies/lookup?q=12345678
 * Public lookup by cédula, placa, or verify code.
 * Returns minimal info (verifyCode, status, policyNumber, nombre) so a user
 * can find their own policy without exposing all data.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (q.length < 3) {
    return NextResponse.json(
      { error: 'Ingrese al menos 3 caracteres' },
      { status: 400 }
    )
  }

  // try exact verify code first
  const byCode = await db.policy.findUnique({ where: { verifyCode: q } })
  if (byCode) {
    return NextResponse.json({
      results: [
        {
          verifyCode: byCode.verifyCode,
          policyNumber: byCode.policyNumber,
          status: byCode.status,
          nombre: byCode.nombre,
          apellido: byCode.apellido,
          marca: byCode.marca,
          modelo: byCode.modelo,
          placa: byCode.placa,
          createdAt: byCode.createdAt,
        },
      ],
    })
  }

  const policies = await db.policy.findMany({
    where: {
      OR: [
        { cedula: { contains: q } },
        { placa: { contains: q } },
        { policyNumber: { contains: q } },
      ],
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      verifyCode: true,
      policyNumber: true,
      status: true,
      nombre: true,
      apellido: true,
      marca: true,
      modelo: true,
      placa: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ results: policies })
}
