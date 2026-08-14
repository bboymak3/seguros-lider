import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1Query } from '@/lib/d1'
import { getAllSettings, setSetting, SETTING_KEYS } from '@/lib/settings'

export const dynamic = 'force-dynamic'

// Inlined defaults so the D1 path can return them without touching Prisma.
const SETTING_DEFAULTS: Record<string, string[]> = {
  ASEGURADORAS: [
    'Seguros Caracas',
    'Mapfre La Seguridad',
    'Oriental de Seguros',
    'Seguros La Previsora',
    'Banesco Seguros',
    'Multinacional de Seguros',
    'Seguros Carabobo',
    'Mappfre',
  ],
  COVERAGE_TYPES: [
    'Responsabilidad Civil',
    'Cobertura Total',
    'Cobertura Amplia',
    'Pérdida Total',
  ],
  VEHICLE_TYPES: [
    'Automóvil',
    'Moto',
    'Camión',
    'Camioneta',
    'Pickup',
    'Autobús',
  ],
  PLAN_TYPES: ['Plan Básico', 'Plan Total', 'Plan Premium', 'Plan Ejecutivo'],
}

async function getAllSettingsD1(): Promise<Record<string, string[]>> {
  const rows = await d1Query<{ key: string; value: string }>(
    'SELECT key, value FROM Setting'
  )
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const result: Record<string, string[]> = {}
  for (const key of Object.keys(SETTING_KEYS)) {
    const raw = map.get(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          result[key] = parsed
          continue
        }
      } catch {
        // fall through to default
      }
    }
    result[key] = SETTING_DEFAULTS[key] || []
  }
  return result
}

/** GET /api/settings — returns all configurable lists */
export async function GET() {
  try {
    if (isD1()) {
      const settings = await getAllSettingsD1()
      return NextResponse.json({ settings })
    } else {
      const settings = await getAllSettings()
      return NextResponse.json({ settings })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
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
