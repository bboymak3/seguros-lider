import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { storage } from './storage'
import { generatePolicyQr } from './qr'

/**
 * Generate the filled insurance certificate PDF from scratch.
 * Recreates the grande.pdf layout with all sections, colors, and user data.
 * No template loading needed - everything is drawn programmatically.
 */

const NAVY = rgb(0, 0.2, 0.4)
const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.4, 0.4, 0.4)
const ORANGE = rgb(0.97, 0.58, 0.11)
const WHITE = rgb(1, 1, 1)
const LIGHT_GREY = rgb(0.95, 0.95, 0.95)

function safe(v?: string | null): string {
  return v && String(v).trim().length > 0 ? String(v) : ''
}

export interface PolicyPdfData {
  verifyCode: string
  policyNumber?: string | null
  nombre: string
  apellido?: string | null
  cedula: string
  tipoCedula?: string | null
  telefono?: string | null
  email?: string | null
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
  tomGenero?: string | null
}

export async function generatePolicyPdf(data: PolicyPdfData) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // A4 portrait
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  function drawText(text: string, x: number, y: number, size: number = 9, bold: boolean = false, color: typeof NAVY = BLACK) {
    const t = safe(text)
    if (!t) return
    try {
      page.drawText(t, { x, y, size, font: bold ? helvBold : helv, color, maxWidth: 200 })
    } catch { /* ignore */ }
  }

  function drawSectionHeader(y: number, title: string) {
    page.drawRectangle({ x: 20, y: y - 12, width: width - 40, height: 16, color: ORANGE })
    drawText(title, 28, y - 8, 8, true, WHITE)
  }

  function drawField(x: number, y: number, label: string, value: string, valW: number = 120) {
    drawText(label, x, y, 7, false, GREY)
    drawText(safe(value) || '—', x + 70, y, 9, true, NAVY)
  }

  // === MARGINS ===
  const ML = 20 // left margin
  const MR = width - 20 // right margin
  const CW = width - 40 // content width

  // === HEADER ===
  // Logo box
  page.drawRectangle({ x: ML, y: height - 50, width: 200, height: 30, color: NAVY })
  drawText('ASOCIACIÓN COOPERATIVA LÍDER', ML + 8, height - 35, 7, true, WHITE)
  drawText('DE SEGUROS PARA VEHÍCULOS R.L.', ML + 8, height - 45, 6, true, WHITE)

  drawText('RIF: J-31300095-5', ML, height - 60, 6, false, GREY)
  drawText('Inscrita en la Superintendencia de la Actividad Aseguradora', ML, height - 70, 5, false, GREY)
  drawText('bajo la credencial ACS-00005', ML, height - 78, 5, false, GREY)

  // Office data box (top right)
  page.drawRectangle({ x: MR - 180, y: height - 80, width: 180, height: 60, borderColor: BLACK, borderWidth: 1, color: WHITE })
  drawText('Oficina: 002-M', MR - 170, height - 28, 7, true)
  drawText('Ramo: AUTOMOVIL RCV', MR - 170, height - 40, 7, true)
  drawText('No. Póliza: ' + safe(data.policyNumber || data.verifyCode), MR - 170, height - 52, 7, true)
  drawText('Tipo: PRIMER AÑO', MR - 170, height - 64, 7, true)

  // === TITLE ===
  drawText('CUADRO PÓLIZA RECIBO DEL SEGURO DE', ML + 80, height - 100, 9, true, NAVY)
  drawText('RESPONSABILIDAD CIVIL DE VEHÍCULOS', ML + 70, height - 112, 9, true, NAVY)

  // === SECTION I: ASEGURADO ===
  drawSectionHeader(height - 140, 'I. Datos del Asegurado - Nombre(s) y Apellidos o Razón Social:')
  const asegName = safe(data.asegNombre || data.nombre) + ' ' + safe(data.asegApellido || data.apellido)
  drawText(asegName.trim(), 200, height - 148, 9, true)
  drawText('Cédula o Rif:', 400, height - 148, 7, false, GREY)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.asegCedula || data.cedula), 470, height - 148, 9, true)

  // === SECTION II: TOMADOR ===
  drawSectionHeader(height - 170, 'II. Datos del Tomador')
  const tomName = safe(data.tomNombre || data.nombre) + ' ' + safe(data.tomApellido || data.apellido)
  
  // Table headers
  page.drawRectangle({ x: ML, y: height - 195, width: CW, height: 14, color: LIGHT_GREY, borderColor: BLACK, borderWidth: 0.5 })
  drawText('NOMBRE', ML + 5, height - 190, 6, true)
  drawText('CÉDULA O RIF', ML + 200, height - 190, 6, true)
  drawText('SEXO', ML + 380, height - 190, 6, true)
  drawText('EDAD', ML + 440, height - 190, 6, true)
  
  drawText(tomName.trim(), ML + 5, height - 210, 8, true)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.tomCedula || data.cedula), ML + 200, height - 210, 8, true)
  drawText(safe(data.tomGenero || 'M').charAt(0).toUpperCase(), ML + 380, height - 210, 8, true)
  
  drawText('Dirección:', ML, height - 230, 7, false, GREY)
  const direccion = [data.tomDireccion, data.tomMunicipio, data.tomEstado].filter(Boolean).join(', ')
  drawText(direccion || '—', ML + 50, height - 230, 8, true)
  
  drawText('Teléfonos:', ML, height - 245, 7, false, GREY)
  drawText(safe(data.tomTelefono || data.telefono), ML + 50, height - 245, 8, true)
  
  drawText('Email:', ML + 300, height - 245, 7, false, GREY)
  drawText(safe(data.tomEmail || data.email) || '—', ML + 340, height - 245, 8, true)

  // === SECTION III: VIGENCIA Y VEHÍCULO ===
  drawSectionHeader(height - 270, 'III. Características del Seguro')

  // Vigencia row
  drawText('Fecha emisión:', ML, height - 290, 7, false, GREY)
  drawText(new Date().toLocaleDateString('es-VE'), ML + 60, height - 290, 8, true)
  drawText('Vigencia Desde:', ML + 180, height - 290, 7, false, GREY)
  drawText(safe(data.vigenciaDesde) || '—', ML + 250, height - 290, 8, true)
  drawText('Hasta:', ML + 360, height - 290, 7, false, GREY)
  drawText(safe(data.vigenciaHasta) || '—', ML + 390, height - 290, 8, true)
  drawText('Moneda: DOLAR', ML + 480, height - 290, 7, true)

  // Vehicle section header
  page.drawRectangle({ x: ML, y: height - 315, width: CW, height: 14, color: ORANGE })
  drawText('DESCRIPCIÓN DEL VEHÍCULO', ML + 5, height - 310, 7, true, WHITE)

  // Vehicle data in table format
  page.drawRectangle({ x: ML, y: height - 370, width: CW, height: 55, color: LIGHT_GREY, borderColor: BLACK, borderWidth: 0.5 })
  
  // Row 1
  drawText('Marca:', ML + 5, height - 325, 7, false, GREY)
  drawText(safe(data.marca) || '—', ML + 45, height - 325, 8, true)
  drawText('Modelo:', ML + 200, height - 325, 7, false, GREY)
  drawText(safe(data.modelo || data.ano) || '—', ML + 245, height - 325, 8, true)
  drawText('Clase:', ML + 380, height - 325, 7, false, GREY)
  drawText(safe(data.clase || data.tipoVehiculo) || '—', ML + 420, height - 325, 8, true)
  
  // Row 2
  drawText('Año:', ML + 5, height - 345, 7, false, GREY)
  drawText(safe(data.ano) || '—', ML + 45, height - 345, 8, true)
  drawText('Color:', ML + 200, height - 345, 7, false, GREY)
  drawText(safe(data.color) || '—', ML + 245, height - 345, 8, true)
  drawText('Uso:', ML + 380, height - 345, 7, false, GREY)
  drawText(safe(data.uso) || '—', ML + 420, height - 345, 8, true)
  
  // Row 3
  drawText('Placa:', ML + 5, height - 365, 7, false, GREY)
  drawText(safe(data.placa) || '—', ML + 45, height - 365, 8, true)
  drawText('Puestos:', ML + 200, height - 365, 7, false, GREY)
  drawText(safe(data.cantidadPuestos) || '—', ML + 250, height - 365, 8, true)
  drawText('Cap. Carga:', ML + 380, height - 365, 7, false, GREY)
  drawText(safe(data.capacidadCarga) || '—', ML + 440, height - 365, 8, true)
  
  // Row 4 - Serials
  drawText('S/C:', ML + 5, height - 385, 7, false, GREY)
  drawText(safe(data.serialCarroceria) || '—', ML + 35, height - 385, 7, true)
  drawText('S/M:', ML + 280, height - 385, 7, false, GREY)
  drawText(safe(data.serialMotor) || '—', ML + 310, height - 385, 7, true)

  // === COBERTURAS ===
  drawSectionHeader(height - 410, 'Coberturas y Riesgos Cubiertos')
  
  page.drawRectangle({ x: ML, y: height - 445, width: CW, height: 14, color: ORANGE })
  drawText('Cobertura', ML + 5, height - 440, 6, true, WHITE)
  drawText('Suma Asegurada', ML + 300, height - 440, 6, true, WHITE)
  drawText('Prima', ML + 480, height - 440, 6, true, WHITE)
  
  drawText('DAÑOS A COSA', ML + 5, height - 460, 7)
  drawText(safe(data.primaUsd || data.prima) || '—', ML + 480, height - 460, 8, true)
  drawText('DAÑOS A PERSONAS', ML + 5, height - 475, 7)
  drawText('0.00', ML + 480, height - 475, 8, true)
  
  // Total
  page.drawRectangle({ x: ML, y: height - 500, width: CW, height: 16, color: NAVY })
  drawText('TOTAL PRIMA:', ML + 350, height - 494, 8, true, WHITE)
  drawText(safe(data.primaUsd || data.prima) || '—', ML + 480, height - 494, 10, true, WHITE)

  // === PLAN ===
  drawText('Plan:', ML, height - 520, 7, false, GREY)
  drawText(safe(data.plan) || '—', ML + 30, height - 520, 8, true)

  // === QR CODE ===
  const qr = await generatePolicyQr(data.verifyCode)
  const qrImg = await pdfDoc.embedPng(qr.buffer)
  const qrSize = 60
  page.drawImage(qrImg, {
    x: width - qrSize - 30,
    y: height - qrSize - 100,
    width: qrSize,
    height: qrSize,
  })
  drawText('Escanee para verificar', width - qrSize - 30, height - qrSize - 112, 5, false, GREY)

  // === STATUS ===
  const status = (data.status || 'PENDIENTE').toUpperCase()
  const statusColor = status === 'APROBADA' ? rgb(0, 0.5, 0) : status === 'RECHAZADA' ? rgb(0.7, 0, 0) : rgb(0.8, 0.5, 0)
  page.drawText(status, {
    x: width / 2 - 30,
    y: 60,
    size: 16,
    font: helvBold,
    color: statusColor,
  })

  // === FOOTER ===
  drawText('© 2026 Asociación Cooperativa Líder de Seguros para Vehículos R.L.', ML, 30, 6, false, GREY)
  drawText('Todos los derechos reservados', ML, 20, 6, false, GREY)
  drawText('Aprobado por la Superintendencia... Providencia N° SAA-09-7673', ML, 10, 5, false, GREY)

  const pdfBytes = await pdfDoc.save()
  let storageKey = ''
  try {
    storageKey = storage.keyFor(data.verifyCode, 'certificado.pdf', 'assets')
    await storage.put(storageKey, Buffer.from(pdfBytes), 'application/pdf')
  } catch { /* ignore */ }

  return { bytes: pdfBytes, storageKey, qrUrl: qr.url }
}
