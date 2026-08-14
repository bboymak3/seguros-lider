import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, setSetting, SETTING_KEYS } from '@/lib/settings'

export const dynamic = 'force-dynamic'

/** GET /api/settings — returns all configurable lists */
export async function GET() {
  const settings = await getAllSettings()
  return NextResponse.json({ settings })
}

/** PUT /api/settings — update one or more lists */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const validKeys = Object.values(SETTING_KEYS) as string[]

    const updates: Promise<void>[] = []
    for (const [key, values] of Object.entries(body)) {
      if (validKeys.includes(key) && Array.isArray(values)) {
        updates.push(setSetting(key as keyof typeof SETTING_KEYS, values as string[]))
      }
    }
    await Promise.all(updates)

    const settings = await getAllSettings()
    return NextResponse.json({ settings, ok: true })
  } catch (e) {
    console.error('settings update error', e)
    return NextResponse.json({ error: 'No se pudo guardar la configuración' }, { status: 500 })
  }
}
