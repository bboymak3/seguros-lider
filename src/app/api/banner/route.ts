import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First, d1Run } from '@/lib/d1'

export const dynamic = 'force-dynamic'

/** GET /api/banner — returns banner config */
export async function GET() {
  try {
    if (isD1()) {
      const row = await d1First<{ value: string }>(
        "SELECT value FROM Setting WHERE key = 'BANNER_CONFIG'"
      )
      if (row?.value) {
        return NextResponse.json({ banner: JSON.parse(row.value) })
      }
    } else {
      const { db } = await import('@/lib/db')
      const row = await db.setting.findUnique({ where: { key: 'BANNER_CONFIG' } })
      if (row?.value) {
        return NextResponse.json({ banner: JSON.parse(row.value) })
      }
    }
  } catch { /* ignore */ }
  
  return NextResponse.json({ banner: null })
}

/** PUT /api/banner — save banner config */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const value = JSON.stringify({
      imageUrl: body.imageUrl || '',
      title: body.title || '',
      subtitle: body.subtitle || '',
      enabled: body.enabled !== false,
    })
    
    if (isD1()) {
      // Check if exists
      const existing = await d1First<{ id: string }>(
        "SELECT id FROM Setting WHERE key = 'BANNER_CONFIG'"
      )
      if (existing) {
        await d1Run(
          "UPDATE Setting SET value = ?, updatedAt = ? WHERE key = 'BANNER_CONFIG'",
          [value, new Date().toISOString()]
        )
      } else {
        await d1Run(
          "INSERT INTO Setting (id, key, value, updatedAt) VALUES (?, 'BANNER_CONFIG', ?, ?)",
          ['set_banner_' + Date.now(), value, new Date().toISOString()]
        )
      }
    } else {
      const { db } = await import('@/lib/db')
      await db.setting.upsert({
        where: { key: 'BANNER_CONFIG' },
        create: { key: 'BANNER_CONFIG', value },
        update: { value },
      })
    }
    
    return NextResponse.json({ ok: true, banner: JSON.parse(value) })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo guardar el banner' }, { status: 500 })
  }
}
