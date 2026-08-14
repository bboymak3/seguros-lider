import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { storage } from './storage'
import { generatePolicyQr } from './qr'
import { PDF_TEMPLATE_BASE64 } from './pdf-template'

/**
 * Generate the filled insurance certificate PDF.
 * Uses the grande.pdf template from the repo as the base, overlays user data.
 */

export interface PolicyPdfData {
  verifyCode: string
  policyNumber?: string | null
  nombre: string
  apellido?: string | null
  cedula: string
  tipoCedula?: string | null
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
  cantidadPuestos?: string | null
  capacidadCarga?: string | null
  plan?: string | null
  prima?: string | null
  primaEur?: string | null
  primaUsd?: string | null
  primaBs?: string | null
  vigenciaDesde?: string | null
  vigenciaHasta?: string | null
  status?: string
  createdAt?: Date | string
  asegNombre?: string | null
  asegApellido?: string | null
  asegCedula?: string | null
  tomNombre?: string | null
  tomApellido?: string | null
  tomCedula?: string | null
  tomTelefono?: string | null
  tomEmail?: string | null
  tomEstado?: string | null
  tomMunicipio?: string | null
  tomParroquia?: string | null
  tomDireccion?: string | null
  tomEstadoCivil?: string | null
  tomGenero?: string | null
  tomFechaNacimiento?: string | null
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

  // Load the template from embedded base64
  let templateDoc: PDFDocument | null = null
  try {
    const templateBytes = Uint8Array.from(atob(PDF_TEMPLATE_BASE64), c => c.charCodeAt(0))
    templateDoc = await PDFDocument.load(templateBytes)
  } catch (e) {
    console.error('Could not load template:', e)
  }

  let page
  if (templateDoc && templateDoc.getPageCount() > 0) {
    const pages = await pdfDoc.copyPages(templateDoc, templateDoc.getPageIndices())
    pages.forEach(p => pdfDoc.addPage(p))
    page = pdfDoc.getPages()[0]
  } else {
    // Fallback: A4 portrait
    page = pdfDoc.addPage([595, 842])
  }

  const { width, height } = page.getSize()

  // Helper functions
  function drawText(text: string, x: number, y: number, size: number = 9, bold: boolean = false, color: typeof NAVY = BLACK) {
    const t = safe(text)
    if (!t) return
    try {
      page.drawText(t, {
        x, y,
        size,
        font: bold ? helvBold : helv,
        color,
      })
    } catch { /* ignore text that can't be drawn */ }
  }

  // === OVERLAY DATA ON TEMPLATE ===
  // Based on analysis of grande.pdf layout:

  // --- Top right: office data box ---
  drawText(safe(data.policyNumber || data.verifyCode), width - 120, height - 60, 10, true, NAVY)

  // --- Section I: Asegurado ---
  const asegName = safe(data.asegNombre || data.nombre) + ' ' + safe(data.asegApellido || data.apellido)
  drawText(asegName.trim(), 180, height - 120, 10, true)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.asegCedula || data.cedula), 450, height - 120, 10, true)

  // --- Section II: Tomador ---
  const tomName = safe(data.tomNombre || data.nombre) + ' ' + safe(data.tomApellido || data.apellido)
  drawText(tomName.trim(), 80, height - 165, 9, true)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.tomCedula || data.cedula), 340, height - 165, 9, true)
  drawText(safe(data.tomGenero || 'M').charAt(0), 480, height - 165, 9, true)

  // Tomador contact
  const direccion = [data.tomDireccion, data.tomMunicipio, data.tomEstado].filter(Boolean).join(', ')
  drawText(direccion, 80, height - 185, 8)
  drawText(safe(data.tomTelefono || data.telefono), 80, height - 200, 8)
  drawText(safe(data.tomEmail || data.email), 340, height - 200, 8)

  // --- Section III: Vigencia ---
  drawText(safe(data.vigenciaDesde), 180, height - 250, 9, true)
  drawText(safe(data.vigenciaHasta), 320, height - 250, 9, true)

  // --- Vehicle data ---
  drawText(safe(data.marca), 80, height - 300, 9, true)
  drawText(safe(data.modelo || data.ano), 230, height - 300, 9, true)
  drawText(safe(data.clase || data.tipoVehiculo), 380, height - 300, 9, true)
  drawText(safe(data.placa), 500, height - 300, 9, true)

  drawText(safe(data.ano), 80, height - 320, 9, true)
  drawText(safe(data.serialCarroceria), 230, height - 320, 8, true)
  drawText(safe(data.serialMotor), 430, height - 320, 8, true)

  drawText(safe(data.color), 80, height - 340, 9, true)
  drawText(safe(data.tipo), 230, height - 340, 9, true)
  drawText(safe(data.uso), 380, height - 340, 9, true)
  drawText(safe(data.capacidadCarga) + (data.capacidadCarga ? 'Kg' : ''), 500, height - 340, 8, true)
  drawText(safe(data.cantidadPuestos), 80, height - 360, 9, true)

  // --- Plan and prima ---
  drawText(safe(data.plan), 80, height - 420, 8, true)
  drawText(safe(data.primaUsd || data.prima), 400, height - 420, 10, true)

  // --- QR Code (top right area, near office box) ---
  const qr = await generatePolicyQr(data.verifyCode)
  const qrImg = await pdfDoc.embedPng(qr.buffer)
  const qrSize = 70
  page.drawImage(qrImg, {
    x: width - qrSize - 140,
    y: height - qrSize - 30,
    width: qrSize,
    height: qrSize,
  })

  // --- Status watermark ---
  const status = (data.status || 'PENDIENTE').toUpperCase()
  const statusColor = status === 'APROBADA' ? rgb(0, 0.5, 0) : status === 'RECHAZADA' ? rgb(0.7, 0, 0) : rgb(0.8, 0.5, 0)
  page.drawText(status, {
    x: width / 2 - 40,
    y: 50,
    size: 14,
    font: helvBold,
    color: statusColor,
  })

  // --- Footer ---
  drawText('© 2026 Asociación Cooperativa Líder de Seguros para Vehículos R.L.', 40, 20, 6, false, GREY)

  const pdfBytes = await pdfDoc.save()
  let storageKey = ''
  try {
    storageKey = storage.keyFor(data.verifyCode, 'certificado.pdf', 'assets')
    await storage.put(storageKey, Buffer.from(pdfBytes), 'application/pdf')
  } catch {
    /* storage might not be available */
  }

  return {
    bytes: pdfBytes,
    storageKey,
    qrUrl: qr.url,
  }
}
