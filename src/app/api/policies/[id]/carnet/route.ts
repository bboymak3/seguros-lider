import { NextRequest, NextResponse } from 'next/server'
import { isD1, d1First } from '@/lib/d1'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { generatePolicyQr } from '@/lib/qr'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

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

    // === LEFT SIDE ===
    page.drawRectangle({ x: 0, y: height - 25, width: width / 2, height: 25, color: NAVY })
    drawText('ASOCIACIÓN COOPERATIVA LÍDER', 8, height - 12, 6, true, WHITE)
    drawText('DE SEGUROS PARA VEHÍCULOS R.L.', 8, height - 20, 5, true, WHITE)
    drawText('RIF: J-31105096-6', 8, height - 32, 5, false, GREY)
    drawText('PROTECCIÓN QUE TE ACOMPAÑA', 8, height - 40, 5, false, ORANGE)
    drawText('CERTIFICADO DE RESPONSABILIDAD', 10, height - 60, 8, true, NAVY)
    drawText('CIVIL VEHICULAR', 10, height - 72, 8, true, NAVY)
    page.drawLine({ start: { x: 10, y: height - 85 }, end: { x: width / 2 - 10, y: height - 85 }, thickness: 0.5, color: GREY })

    const asegName = safe(p.asegNombre || p.nombre) + ' ' + safe(p.asegApellido || p.apellido)
    drawText('Asegurado:', 10, height - 100, 6, false, GREY)
    drawText(asegName.trim(), 55, height - 100, 8, true)
    drawText('Cédula:', 10, height - 115, 6, false, GREY)
    drawText(safe(p.tipoCedula || 'V') + '-' + safe(p.asegCedula || p.cedula), 45, height - 115, 8, true)
    drawText('Tomador:', 200, height - 100, 6, false, GREY)
    drawText(asegName.trim(), 240, height - 100, 8, true)
    drawText('Cédula:', 200, height - 115, 6, false, GREY)
    drawText(safe(p.tipoCedula || 'V') + '-' + safe(p.tomCedula || p.cedula), 235, height - 115, 8, true)

    page.drawRectangle({ x: 5, y: height - 140, width: width / 2 - 10, height: 14, color: ORANGE })
    drawText('DATOS DEL VEHÍCULO', 10, height - 135, 6, true, WHITE)

    drawText('Clase:', 10, height - 155, 6, false, GREY); drawText(safe(p.clase || p.tipoVehiculo) || '—', 40, height - 155, 7, true)
    drawText('Marca:', 10, height - 168, 6, false, GREY); drawText(safe(p.marca) || '—', 40, height - 168, 7, true)
    drawText('Modelo:', 10, height - 181, 6, false, GREY); drawText(safe(p.modelo || p.ano) || '—', 45, height - 181, 7, true)
    drawText('Año:', 10, height - 194, 6, false, GREY); drawText(safe(p.ano) || '—', 35, height - 194, 7, true)
    drawText('Color:', 10, height - 207, 6, false, GREY); drawText(safe(p.color) || '—', 40, height - 207, 7, true)
    drawText('Uso:', 180, height - 155, 6, false, GREY); drawText(safe(p.uso) || '—', 200, height - 155, 7, true)
    drawText('Placa:', 180, height - 168, 6, false, GREY); drawText(safe(p.placa) || '—', 210, height - 168, 7, true)
    drawText('Tipo:', 180, height - 181, 6, false, GREY); drawText(safe(p.tipo) || '—', 205, height - 181, 7, true)
    drawText('S/M:', 180, height - 194, 6, false, GREY); drawText(safe(p.serialMotor) || '—', 200, height - 194, 6, true)
    drawText('S/C:', 180, height - 207, 6, false, GREY); drawText(safe(p.serialCarroceria) || '—', 200, height - 207, 6, true)

    page.drawLine({ start: { x: 10, y: height - 220 }, end: { x: width / 2 - 10, y: height - 220 }, thickness: 0.5, color: GREY })
    drawText('VIGENCIA:', 10, height - 235, 6, true, NAVY)
    const vigDesde = safe(p.vigenciaDesde) || new Date().toLocaleDateString('es-VE')
    const fechaFin = new Date(vigDesde); fechaFin.setFullYear(fechaFin.getFullYear() + 1)
    const vigHasta = safe(p.vigenciaHasta) || fechaFin.toLocaleDateString('es-VE')
    drawText(vigDesde + ' - ' + vigHasta, 55, height - 235, 7, true)
    drawText('N°:', 10, height - 250, 6, true, NAVY)
    drawText(safe(p.policyNumber) || safe(p.verifyCode), 25, height - 250, 8, true)

    // === RIGHT SIDE ===
    const rightX = width / 2 + 10
    page.drawLine({ start: { x: width / 2, y: 10 }, end: { x: width / 2, y: height - 10 }, thickness: 0.5, color: GREY })
    drawText('PROTECCIÓN QUE TE ACOMPAÑA', rightX, height - 30, 10, true, NAVY)
    drawText('CONTACTO:', rightX, height - 50, 7, true)
    drawText('(0424)-257.22.72', rightX, height - 70, 7)
    drawText('(0412)-996.17.99', rightX, height - 85, 7)
    drawText('@liderdesegurosparavehiculos', rightX, height - 100, 7)
    drawText('sucursalmiranda@liderdeseguros.com', rightX, height - 115, 7)

    // QR
    const qr = await generatePolicyQr(safe(p.verifyCode))
    const qrImg = await pdfDoc.embedPng(qr.buffer)
    const qrSize = 55
    page.drawImage(qrImg, { x: width - qrSize - 20, y: height - qrSize - 30, width: qrSize, height: qrSize })

    drawText('Lleva tus documentos digitales', rightX, height - 150, 5, false, GREY)
    drawText('Respeta las señales de tránsito', rightX, height - 165, 5, false, GREY)
    drawText('Usa el cinturón de seguridad', rightX, height - 180, 5, false, GREY)
    drawText('Evita distracciones, no uses el celular', rightX, height - 195, 5, false, GREY)
    drawText('Inscrita en la Superintendencia... ACS-000005', rightX, height - 220, 4, false, GREY)
    drawText('Autorización SUNACOOP N° 95198', rightX, height - 230, 4, false, GREY)

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
