import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First } from '@/lib/d1'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { generatePolicyQr } from '@/lib/qr'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Helper: always returns a valid "Hasta" date = emision + 1 year.
 * Handles both ISO format (2026-08-14) and es-VE format (14/8/2026).
 */
function calcVencimiento(vigDesde: string, vigHasta?: string): string {
  if (vigHasta && vigHasta.trim() && !vigHasta.includes('Invalid')) return vigHasta
  let fecha: Date
  if (vigDesde && !vigDesde.includes('Invalid')) {
    // Try ISO first
    const iso = new Date(vigDesde)
    if (!isNaN(iso.getTime())) {
      fecha = new Date(iso)
    } else {
      // Try es-VE format: DD/MM/YYYY
      const parts = vigDesde.split('/')
      if (parts.length === 3) {
        fecha = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      } else {
        fecha = new Date()
      }
    }
  } else {
    fecha = new Date()
  }
  fecha.setFullYear(fecha.getFullYear() + 1)
  return fecha.toLocaleDateString('es-VE')
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  try {
    let p: Record<string, unknown> | null = null
    if (isD1()) {
      p = await d1First<Record<string, unknown>>('SELECT * FROM Policy WHERE id = ?', [id])
    } else {
      const { db } = await import('@/lib/db')
      p = await db.policy.findUnique({ where: { id } }) as Record<string, unknown> | null
    }
    if (!p) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const pdfDoc = await PDFDocument.create()
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const page = pdfDoc.addPage([595, 280])
    const { width, height } = page.getSize()

    const NAVY = rgb(0, 0.2, 0.4)
    const BLACK = rgb(0, 0, 0)
    const GREY = rgb(0.4, 0.4, 0.4)
    const ORANGE = rgb(0.97, 0.58, 0.11)
    const WHITE = rgb(1, 1, 1)

    function safe(v: unknown): string {
      return v && String(v).trim().length > 0 ? String(v) : ''
    }
    function drawText(text: string, x: number, y: number, size = 8, bold = false, color: typeof NAVY = BLACK) {
      const t = safe(text)
      if (!t) return
      try { page.drawText(t, { x, y, size, font: bold ? helvBold : helv, color, maxWidth: 200 }) } catch {}
    }

    // === LEFT SIDE === (10% more compact = reduce all Y offsets by ~1.5pts)
    page.drawRectangle({ x: 0, y: height - 25, width: width / 2, height: 25, color: NAVY })
    drawText('ASOCIACIÓN COOPERATIVA LÍDER', 8, height - 12, 6, true, WHITE)
    drawText('DE SEGUROS PARA VEHÍCULOS R.L.', 8, height - 20, 5, true, WHITE)
    drawText('RIF: J-31105096-6', 8, height - 32, 5, false, GREY)
    drawText('PROTECCIÓN QUE TE ACOMPAÑA', 8, height - 39, 5, false, ORANGE)
    drawText('CERTIFICADO DE RESPONSABILIDAD', 10, height - 57, 8, true, NAVY)
    drawText('CIVIL VEHICULAR', 10, height - 69, 8, true, NAVY)
    page.drawLine({ start: { x: 10, y: height - 82 }, end: { x: width / 2 - 10, y: height - 82 }, thickness: 0.5, color: GREY })

    const asegName = safe(p.asegNombre || p.nombre) + ' ' + safe(p.asegApellido || p.apellido)
    drawText('Asegurado:', 10, height - 96, 6, false, GREY)
    drawText(asegName.trim(), 55, height - 96, 8, true)
    drawText('Cédula:', 10, height - 109, 6, false, GREY)
    drawText(safe(p.tipoCedula || 'V') + '-' + safe(p.asegCedula || p.cedula), 45, height - 109, 8, true)
    drawText('Tomador:', 200, height - 96, 6, false, GREY)
    drawText(asegName.trim(), 240, height - 96, 8, true)
    drawText('Cédula:', 200, height - 109, 6, false, GREY)
    drawText(safe(p.tipoCedula || 'V') + '-' + safe(p.tomCedula || p.cedula), 235, height - 109, 8, true)

    page.drawRectangle({ x: 5, y: height - 132, width: width / 2 - 10, height: 14, color: ORANGE })
    drawText('DATOS DEL VEHÍCULO', 10, height - 127, 6, true, WHITE)

    // 10% more compact: reduce spacing from 13 to ~11.5
    drawText('Clase:', 10, height - 146, 6, false, GREY); drawText(safe(p.clase || p.tipoVehiculo) || '—', 40, height - 146, 7, true)
    drawText('Marca:', 10, height - 158, 6, false, GREY); drawText(safe(p.marca) || '—', 40, height - 158, 7, true)
    drawText('Modelo:', 10, height - 169, 6, false, GREY); drawText(safe(p.modelo || p.ano) || '—', 45, height - 169, 7, true)
    drawText('Año:', 10, height - 180, 6, false, GREY); drawText(safe(p.ano) || '—', 35, height - 180, 7, true)
    drawText('Color:', 10, height - 191, 6, false, GREY); drawText(safe(p.color) || '—', 40, height - 191, 7, true)
    drawText('Uso:', 180, height - 146, 6, false, GREY); drawText(safe(p.uso) || '—', 200, height - 146, 7, true)
    drawText('Placa:', 180, height - 158, 6, false, GREY); drawText(safe(p.placa) || '—', 210, height - 158, 7, true)
    drawText('Tipo:', 180, height - 169, 6, false, GREY); drawText(safe(p.tipo) || '—', 205, height - 169, 7, true)
    drawText('S/M:', 180, height - 180, 6, false, GREY); drawText(safe(p.serialMotor) || '—', 200, height - 180, 6, true)
    drawText('S/C:', 180, height - 191, 6, false, GREY); drawText(safe(p.serialCarroceria) || '—', 200, height - 191, 6, true)

    page.drawLine({ start: { x: 10, y: height - 202 }, end: { x: width / 2 - 10, y: height - 202 }, thickness: 0.5, color: GREY })

    // === VIGENCIA (fix Invalid Date) ===
    drawText('VIGENCIA:', 10, height - 216, 6, true, NAVY)
    // Use vigenciaDesde, or createdAt as fallback for the emission date
    const vigDesdeRaw = safe(p.vigenciaDesde) || (safe(p.createdAt) ? new Date(safe(p.createdAt)).toLocaleDateString('es-VE') : new Date().toLocaleDateString('es-VE'))
    const vigHasta = calcVencimiento(vigDesdeRaw, safe(p.vigenciaHasta))
    drawText(vigDesdeRaw + ' - ' + vigHasta, 55, height - 216, 7, true)

    // N° Póliza + N° Recibo
    drawText('N° Póliza:', 10, height - 230, 6, true, NAVY)
    drawText(safe(p.policyNumber) || safe(p.verifyCode), 55, height - 230, 7, true)
    drawText('N° Recibo:', 180, height - 230, 6, true, NAVY)
    drawText(safe(p.verifyCode), 230, height - 230, 7, true)

    // === RIGHT SIDE ===
    const rightX = width / 2 + 10
    page.drawLine({ start: { x: width / 2, y: 10 }, end: { x: width / 2, y: height - 10 }, thickness: 0.5, color: GREY })
    drawText('PROTECCIÓN QUE TE ACOMPAÑA', rightX, height - 30, 10, true, NAVY)
    drawText('CONTACTO:', rightX, height - 50, 7, true)
    drawText('(0424)-257.22.72', rightX, height - 70, 7)
    drawText('(0412)-996.17.99', rightX, height - 85, 7)
    drawText('@liderdesegurosparavehiculos', rightX, height - 100, 7)
    drawText('sucursalmiranda@liderdeseguros.com', rightX, height - 115, 7)

    // QR: bajado 6 renglones (~36pts) + aumentado 30% (55->72)
    const qr = await generatePolicyQr(safe(p.verifyCode))
    const qrImg = await pdfDoc.embedPng(qr.buffer)
    const qrSize = 79 // 72 * 1.1 = 79.2 ≈ 79 (+10%)
    page.drawImage(qrImg, {
      x: width - qrSize - 20,
      y: height - qrSize - 72, // bajado 1 renglón más (de -66 a -72)
      width: qrSize,
      height: qrSize,
    })

    drawText('Lleva tus documentos digitales', rightX, height - 150, 5, false, GREY)
    drawText('Respeta las señales de tránsito', rightX, height - 165, 5, false, GREY)
    drawText('Usa el cinturón de seguridad', rightX, height - 180, 5, false, GREY)
    drawText('Evita distracciones, no uses el celular', rightX, height - 195, 5, false, GREY)
    drawText('Inscrita en la Superintendencia... ACS-000005', rightX, height - 220, 4, false, GREY)
    drawText('Autorización SUNACOOP N° 95198', rightX, height - 230, 4, false, GREY)

    // Status
    const status = safe(p.status).toUpperCase() || 'PENDIENTE'
    const sc = status === 'APROBADA' ? rgb(0, 0.5, 0) : rgb(0.8, 0.5, 0)
    drawText(status, width / 2 - 20, 10, 8, true, sc)

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="carnet-${safe(p.verifyCode)}.pdf"`, 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error: ' + (e as Error).message }, { status: 500 })
  }
}
