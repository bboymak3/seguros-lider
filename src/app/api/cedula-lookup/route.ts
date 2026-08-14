import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cne-lookup?cedula=12345678
 * 
 * Usa sistemaspnp.com como proxy para consultar datos del CNE.
 * Este sitio usa servidores en Brasil que NO son bloqueados por el CNE.
 * 
 * Flujo:
 * 1. GET a sistemaspnp.com/cedula/ para obtener cookies de sesión + captcha
 * 2. Parsear el captcha matemático (ej: "¿Cuánto es 4 + 2?")
 * 3. POST con cédula + respuesta del captcha + cookies
 * 4. Parsear el HTML del resultado
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
    // Step 1: GET the form page to get session cookies + captcha
    const formRes = await fetch('https://www.sistemaspnp.com/cedula/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-VE,es;q=0.9',
      },
    })

    // Extract cookies from response
    const cookies = extractCookies(formRes.headers.getSetCookie?.() || [])
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ')

    const formHtml = await formRes.text()

    // Step 2: Parse captcha (e.g., "¿Cuánto es 4 + 2?")
    const captchaMatch = formHtml.match(/¿Cuánto es (\d+) \+ (\d+)\?/)
    if (!captchaMatch) {
      return NextResponse.json(
        { error: 'No se pudo obtener el captcha del CNE. Intenta nuevamente.' },
        { status: 502 }
      )
    }

    const captchaAnswer = parseInt(captchaMatch[1]) + parseInt(captchaMatch[2])

    // Step 3: POST the form with cédula + captcha answer
    const postRes = await fetch('https://www.sistemaspnp.com/cedula/resultado.php', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es-VE,es;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.sistemaspnp.com/cedula/',
        'Cookie': cookieHeader,
      },
      body: `cedula=${cedula}&captcha=${captchaAnswer}&jeje=`,
      redirect: 'follow',
    })

    const resultHtml = await postRes.text()

    // Step 4: Parse the result HTML
    // Check for errors
    if (resultHtml.includes('RECORD_NOT_FOUND')) {
      return NextResponse.json(
        { error: 'La cédula no se encuentra en el Registro Electoral' },
        { status: 404 }
      )
    }

    if (resultHtml.includes('Error en la consulta')) {
      const errorMatch = resultHtml.match(/<strong>Error en la consulta:<\/strong>\s*(.*?)</)
      return NextResponse.json(
        { error: errorMatch ? errorMatch[1] : 'Error en la consulta del CNE' },
        { status: 502 }
      )
    }

    // Parse person data from HTML
    const person = parseResultHtml(resultHtml, cedula)

    if (!person.nombres && !person.primerApellido) {
      return NextResponse.json(
        { error: 'No se pudieron extraer los datos. Intenta nuevamente.' },
        { status: 404 }
      )
    }

    // Build full name
    const fullName = [person.nombres, person.primerApellido, person.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .replace(/ -$/, '')
      .trim()

    return NextResponse.json({
      person: {
        cedula,
        nombre: fullName,
        primerApellido: person.primerApellido || '',
        segundoApellido: person.segundoApellido || '',
        nombres: person.nombres || '',
        estado: person.estado || '',
        municipio: person.municipio || '',
        parroquia: person.parroquia || '',
        rif: person.rif || '',
      }
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Error al consultar: ' + (e as Error).message },
      { status: 500 }
    )
  }
}

function extractCookies(setCookieHeaders: string[]): string[] {
  return setCookieHeaders
}

function parseResultHtml(html: string, cedula: string) {
  const data: {
    nombres: string
    primerApellido: string
    segundoApellido: string
    estado: string
    municipio: string
    parroquia: string
    rif: string
  } = {
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    estado: '',
    municipio: '',
    parroquia: '',
    rif: '',
  }

  function extractField(label: string): string {
    const regex = new RegExp(
      `<strong>${label}:</strong>\\s*(.*?)(?:</p>|<br>)`,
      'is'
    )
    const match = html.match(regex)
    if (match) {
      return match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim()
    }
    return ''
  }

  data.primerApellido = extractField('Primer Apellido')
  data.segundoApellido = extractField('Segundo Apellido')
  data.nombres = extractField('Nombres')
  data.rif = extractField('RIF')
  data.estado = extractField('Estado')
  data.municipio = extractField('Municipio')
  data.parroquia = extractField('Parroquia')

  // Clean up "-" placeholders
  Object.keys(data).forEach(k => {
    if (data[k as keyof typeof data] === '-') {
      (data as Record<string, string>)[k] = ''
    }
  })

  return data
}
