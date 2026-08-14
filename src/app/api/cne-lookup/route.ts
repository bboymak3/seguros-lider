import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cne-lookup?cedula=12345678
 * Consulta el CNE para auto-completar datos.
 * Intenta múltiples estrategias: proxy en Render, CORS proxies, directo.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cedula = (searchParams.get('cedula') || '').trim()

  if (!cedula || !/^\d{4,8}$/.test(cedula)) {
    return NextResponse.json(
      { error: 'Cédula inválida. Debe contener entre 4 y 8 dígitos.' },
      { status: 400 }
    )
  }

  // Lista de proxies a intentar (en orden)
  const proxies = [
    `https://cne-proxy.onrender.com/api/cne?cedula=${cedula}`,
  ]

  let lastError = ''

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(20000),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        lastError = errData.error || `HTTP ${res.status}`
        continue
      }

      const data = await res.json()
      if (data.error) {
        lastError = data.error
        // If it's a "not found" error, return it immediately
        if (data.error.includes('no se encuentra inscrito') || data.error.includes('no encontrada')) {
          return NextResponse.json({ error: data.error }, { status: 404 })
        }
        continue
      }

      if (data.person) {
        return NextResponse.json({ person: data.person })
      }
    } catch (e) {
      lastError = (e as Error).message
    }
  }

  // Si todo falla, devolver error con mensaje claro
  return NextResponse.json(
    { 
      error: `No se pudo consultar el CNE en este momento. ${lastError}. Puedes ingresar los datos manualmente.`,
      cedula 
    },
    { status: 502 }
  )
}
