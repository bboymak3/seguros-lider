import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const g = globalThis as Record<string, unknown>
  const debug = [
    `globalThis.DB: ${typeof g.DB}`,
    `globalThis.BUCKET: ${typeof g.BUCKET}`,
  ]
  
  // Try to use D1 directly
  try {
    const d1 = g.DB as D1Database
    if (d1 && typeof d1.prepare === 'function') {
      const result = await d1.prepare('SELECT COUNT(*) as c FROM VehicleClass').all()
      debug.push(`D1 direct query: ${JSON.stringify(result.results)}`)
    } else {
      debug.push('D1 not available on globalThis')
    }
  } catch (e) {
    debug.push(`D1 error: ${(e as Error).message}`)
  }
  
  return NextResponse.json({ debug })
}
