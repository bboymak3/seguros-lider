import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const g = globalThis as Record<string, unknown>
  const debug = [`globalThis.DB: ${typeof g.DB}`]
  
  // Test D1
  try {
    const d1 = g.DB as D1Database
    if (d1) {
      const r = await d1.prepare('SELECT COUNT(*) as c FROM VehicleClass').all()
      debug.push(`D1 classes: ${JSON.stringify(r.results)}`)
    }
  } catch (e) { debug.push(`D1 error: ${(e as Error).message}`) }
  
  // Test CNE connectivity
  try {
    const res = await fetch('http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=10100001', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    })
    debug.push(`CNE direct: HTTP ${res.status}`)
    if (res.ok) {
      const text = await res.text()
      debug.push(`CNE response length: ${text.length}`)
      debug.push(`CNE contains 'Nombre': ${text.includes('Nombre')}`)
    }
  } catch (e) { debug.push(`CNE direct error: ${(e as Error).message}`) }
  
  // Test CNE via HTTPS
  try {
    const res = await fetch('https://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=10100001', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    })
    debug.push(`CNE HTTPS: HTTP ${res.status}`)
    if (res.ok) {
      const text = await res.text()
      debug.push(`CNE HTTPS length: ${text.length}`)
    }
  } catch (e) { debug.push(`CNE HTTPS error: ${(e as Error).message}`) }
  
  return NextResponse.json({ debug })
}
