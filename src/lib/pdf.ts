import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { storage } from './storage'
import { generatePolicyQr } from './qr'

/**
 * Generate the filled insurance certificate PDF using pdfclean.pdf as template.
 * Loads the template, overlays user data, and embeds the QR code.
 */

export interface PolicyPdfData {
  verifyCode: string
  policyNumber?: string | null
  nombre: string
  apellido?: string | null
  cedula: string
  tipoCedula?: string | null
  fechaNacimiento?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
  tipoVehiculo?: string | null
  marca?: string | null
  modelo?: string | null
  ano?: string | null
  placa?: string | null
  color?: string | null
  serialCarroceria?: string | null
  serialMotor?: string | null
  uso?: string | null
  clase?: string | null
  tipo?: string | null
  poseeTrailer?: string | null
  placaExtranjera?: string | null
  cantidadPuestos?: string | null
  capacidadCarga?: string | null
  tipoCobertura?: string | null
  compania?: string | null
  plan?: string | null
  prima?: string | null
  primaEur?: string | null
  primaUsd?: string | null
  primaBs?: string | null
  sumaAsegurada?: string | null
  deducible?: string | null
  vigenciaDesde?: string | null
  vigenciaHasta?: string | null
  frecuenciaPago?: string | null
  status?: string
  createdAt?: Date | string
  // Asegurado
  asegNombre?: string | null
  asegApellido?: string | null
  asegCedula?: string | null
  // Tomador
  tomNombre?: string | null
  tomApellido?: string | null
  tomCedula?: string | null
}

const NAVY = rgb(0, 0.2, 0.4)
const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.4, 0.4, 0.4)

function safe(v?: string | null): string {
  return v && String(v).trim().length > 0 ? String(v) : ''
}

export async function generatePolicyPdf(data: PolicyPdfData) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Try to load the template
  let templateDoc: PDFDocument | null = null
  try {
    // In Cloudflare Workers, fetch from the assets binding
    let templateBytes: Uint8Array | null = null
    try {
      const res = await fetch('https://appseguros.estilosgrado33.workers.dev/pdfclean.pdf')
      if (res.ok) {
        templateBytes = new Uint8Array(await res.arrayBuffer())
      }
    } catch {
      /* ignore */
    }

    if (templateBytes) {
      templateDoc = await PDFDocument.load(templateBytes)
    }
  } catch (e) {
    console.error('Could not load template, generating from scratch:', e)
  }

  let page
  if (templateDoc && templateDoc.getPageCount() > 0) {
    // Copy the template page
    const [templatePage] = await pdfDoc.copyPages(templateDoc, [0])
    pdfDoc.addPage(templatePage)
    page = pdfDoc.getPages()[0]
  } else {
    // Fallback: generate from scratch (landscape A4)
    page = pdfDoc.addPage([842, 595])
  }

  const { width, height } = page.getSize()

  // Helper: draw text at position
  function drawText(text: string, x: number, y: number, opts: {
    size?: number
    font?: typeof helv | typeof helvBold
    color?: typeof NAVY | typeof BLACK
  } = {}) {
    const t = safe(text)
    if (!t) return
    page.drawText(t, {
      x, y,
      size: opts.size || 9,
      font: opts.font || helv,
      color: opts.color || BLACK,
    })
  }

  // Helper: draw label + value
  function drawField(label: string, value: string, x: number, y: number, labelW: number = 60) {
    drawText(label, x, y, { size: 7, font: helv, color: GREY })
    drawText(safe(value) || '—', x + labelW, y, { size: 9, font: helvBold, color: NAVY })
  }

  // === OVERLAY DATA ON TEMPLATE ===
  // Based on analysis of pdflleno.pdf, the layout is:
  // Left side: asegurado, tomador, vehículo, vigencia
  // Right side: QR, contact info

  // Asegurado
  const asegName = safe(data.asegNombre || data.nombre) + ' ' + safe(data.asegApellido || data.apellido)
  drawField('Asegurado:', asegName.trim(), 40, height - 120, 55)
  drawField('Cédula:', safe(data.asegCedula || data.cedula), 250, height - 120, 40)

  // Tomador
  const tomName = safe(data.tomNombre || data.nombre) + ' ' + safe(data.tomApellido || data.apellido)
  drawField('Tomador:', tomName.trim(), 40, height - 138, 55)
  drawField('Cédula:', safe(data.tomCedula || data.cedula), 250, height - 138, 40)

  // Datos del Vehículo (two columns)
  drawField('Clase:', safe(data.clase || data.tipoVehiculo), 40, height - 180, 40)
  drawField('Marca:', safe(data.marca), 220, height - 180, 40)
  drawField('Modelo:', safe(data.modelo || data.ano), 400, height - 180, 40)

  drawField('Año:', safe(data.ano), 40, height - 200, 40)
  drawField('Color:', safe(data.color), 220, height - 200, 40)
  drawField('Uso:', safe(data.uso), 400, height - 200, 40)

  drawField('Placa:', safe(data.placa), 40, height - 220, 40)
  drawField('Tipo:', safe(data.tipo), 220, height - 220, 40)

  drawField('S/M:', safe(data.serialMotor), 40, height - 240, 35)
  drawField('S/C:', safe(data.serialCarroceria), 400, height - 240, 35)

  // Vigencia
  drawField('Vigencia:', safe(data.vigenciaDesde) + ' - ' + safe(data.vigenciaHasta), 40, height - 280, 50)
  drawField('N° Póliza:', safe(data.policyNumber || data.verifyCode), 300, height - 280, 55)

  // Plan
  drawField('Plan:', safe(data.plan), 40, height - 300, 40)
  drawField('Prima:', safe(data.primaEur) + '€ / ' + safe(data.primaUsd) + '$ / ' + safe(data.primaBs) + 'Bs', 200, height - 300, 40)

  // === QR CODE (top right) ===
  const qr = await generatePolicyQr(data.verifyCode)
  const qrImg = await pdfDoc.embedPng(qr.buffer)
  const qrSize = 80
  page.drawImage(qrImg, {
    x: width - qrSize - 30,
    y: height - qrSize - 30,
    width: qrSize,
    height: qrSize,
  })

  // === STATUS WATERMARK ===
  const status = (data.status || 'PENDIENTE').toUpperCase()
  const statusColor = status === 'APROBADA' ? rgb(0, 0.5, 0) : status === 'RECHAZADA' ? rgb(0.7, 0, 0) : rgb(0.8, 0.5, 0)
  page.drawText(status, {
    x: width / 2 - 60,
    y: 30,
    size: 14,
    font: helvBold,
    color: statusColor,
  })

  // === FOOTER ===
  page.drawText('© 2026 Asociación Cooperativa Líder de Seguros para Vehículos R.L.', {
    x: 40,
    y: 15,
    size: 6,
    font: helv,
    color: GREY,
  })

  const pdfBytes = await pdfDoc.save()
  let storageKey = ''
  try {
    storageKey = storage.keyFor(data.verifyCode, 'certificado.pdf', 'assets')
    await storage.put(storageKey, Buffer.from(pdfBytes), 'application/pdf')
  } catch {
    /* storage might not be available in Workers */
  }

  return {
    bytes: pdfBytes,
    storageKey,
    qrUrl: qr.url,
  }
}
