import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cne-lookup?cedula=12345678
 * Consulta el registro electoral del CNE para auto-completar datos.
 * Retorna: nombre, estado, municipio, parroquia.
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

  try {
    // Try HTTPS first, fallback to HTTP via a proxy
    const url = `https://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}`
    let res: Response
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-VE,es;q=0.9',
        },
        redirect: 'follow',
      })
    } catch {
      // If HTTPS fails, try HTTP (some Workers runtimes allow it)
      res = await fetch(`http://www.cne.gob.ve/web/registro_electoral/ce.php?nacionalidad=V&cedula=${cedula}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      })
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `CNE respondió con código ${res.status}. Intenta nuevamente.` },
        { status: 502 }
      )
    }

    const html = await res.text()

    // Check for not found
    if (html.includes('dula de identidad no se encuentra inscrito')) {
      return NextResponse.json(
        { error: 'La cédula no se encuentra inscrita en el Registro Electoral' },
        { status: 404 }
      )
    }

    if (html.includes('dula de identidad presenta una objec')) {
      return NextResponse.json(
        { error: 'La cédula presenta una objeción' },
        { status: 404 }
      )
    }

    // Parse HTML to extract data
    const person = parseCNEHtml(html, cedula)

    if (!person.nombre) {
      return NextResponse.json(
        { error: 'No se encontraron datos para esta cédula' },
        { status: 404 }
      )
    }

    return NextResponse.json({ person })
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al consultar el CNE: ' + (e as Error).message },
      { status: 500 }
    )
  }
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

  // Helper: extract text after a label in HTML table cells
  function extractAfter(label: string): string {
    // Pattern: <td>Label:</td><td>Value</td>
    const regex = new RegExp(
      label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '\\s*:?\\s*</td>\\s*<td[^>]*>(.*?)</td>',
      'is'
    )
    const match = html.match(regex)
    if (match) {
      let val = match[1]
        .replace(/<[^>]*>/g, '') // strip HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()
      // Clean prefixes
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
