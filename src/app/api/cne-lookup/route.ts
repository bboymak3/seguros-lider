import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cne-lookup?cedula=12345678
 * Consulta el CNE para auto-completar datos del usuario.
 * Como el CNE bloquea Cloudflare IPs, usamos un proxy externo.
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

  // Try multiple proxies since CNE blocks Cloudflare IPs
  const proxies = [
    `https://cne-proxy.onrender.com/api/cne?cedula=${cedula}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}`)}`,
  ]

  let lastError = 'No se pudo conectar con el CNE'

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        lastError = `CNE: HTTP ${res.status}`
        continue
      }

      const contentType = res.headers.get('content-type') || ''

      // If proxy returns JSON (our Render proxy), use it directly
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (data.error) {
          lastError = data.error
          continue
        }
        if (data.person) {
          return NextResponse.json({ person: data.person })
        }
      }

      // If proxy returns HTML (allorigins/corsproxy), parse it
      if (contentType.includes('text/html') || contentType.includes('text/')) {
        const html = await res.text()
        if (html && html.length > 100 && !html.includes('Forbidden') && !html.includes('error code:')) {
          const person = parseCNEHtml(html, cedula)
          if (person.nombre) {
            return NextResponse.json({ person })
          }
          if (html.includes('dula de identidad no se encuentra inscrito')) {
            return NextResponse.json(
              { error: 'La cédula no se encuentra inscrita en el Registro Electoral' },
              { status: 404 }
            )
          }
        }
        lastError = 'Respuesta del CNE sin datos válidos'
      }
    } catch (e) {
      lastError = `Error: ${(e as Error).message}`
    }
  }

  return NextResponse.json(
    { error: `No se pudo consultar el CNE. ${lastError}. Verifica la cédula e intenta nuevamente.` },
    { status: 502 }
  )
}

function parseCNEHtml(html: string, cedula: string) {
  const person: {
    cedula: string
    nombre: string
    estado: string
    municipio: string
    parroquia: string
  } = {
    cedula,
    nombre: '',
    estado: '',
    municipio: '',
    parroquia: '',
  }

  function extractAfter(label: string): string {
    const regex = new RegExp(
      label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '\\s*:?\\s*</td>\\s*<td[^>]*>(.*?)</td>',
      'is'
    )
    const match = html.match(regex)
    if (match) {
      let val = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()
      val = val
        .replace(/^EDO\.\s*/i, '')
        .replace(/^MP\.\s*/i, '')
        .replace(/^MP\s+/i, '')
        .replace(/^BLVNO\s+/i, '')
        .replace(/^CM\.\s*/i, '')
        .replace(/^PQ\.\s*/i, '')
      return val
    }
    return ''
  }

  person.nombre = extractAfter('Nombre')
  person.estado = extractAfter('Estado')
  person.municipio = extractAfter('Municipio')
  person.parroquia = extractAfter('Parroquia')

  return person
}
