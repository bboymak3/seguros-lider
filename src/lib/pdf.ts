import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { storage } from './storage'
import { generatePolicyQr } from './qr'

const NAVY = rgb(0, 0.2, 0.4)
const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.4, 0.4, 0.4)
const ORANGE = rgb(0.97, 0.58, 0.11)
const WHITE = rgb(1, 1, 1)
const LIGHT_GREY = rgb(0.95, 0.95, 0.95)
const LIGHT_ORANGE = rgb(1, 0.93, 0.85)

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
  sumaAsegurada?: string | null
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
  tomFechaNacimiento?: string | null
  poseeTrailer?: string | null
  placaExtranjera?: string | null
}

export async function generatePolicyPdf(data: PolicyPdfData) {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const helvOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const ML = 20, MR = width - 20, CW = width - 40

  function drawText(text: string, x: number, y: number, size: number = 9, bold: boolean = false, color: typeof NAVY = BLACK, maxW?: number) {
    const t = safe(text)
    if (!t) return
    try {
      page.drawText(t, { x, y, size, font: bold ? helvBold : helv, color, maxWidth: maxW || 250 })
    } catch { /* ignore */ }
  }

  function drawSectionHeader(y: number, title: string) {
    page.drawRectangle({ x: ML, y: y - 12, width: CW, height: 16, color: ORANGE })
    drawText(title, 28, y - 8, 8, true, WHITE)
  }

  function drawField(x: number, y: number, label: string, value: string, labelW: number = 65) {
    drawText(label, x, y, 7, false, GREY)
    drawText(safe(value) || '—', x + labelW, y, 8, true, NAVY)
  }

  // === HEADER ===
  page.drawRectangle({ x: ML, y: height - 50, width: 220, height: 30, color: NAVY })
  drawText('ASOCIACIÓN COOPERATIVA LÍDER', ML + 8, height - 35, 7, true, WHITE)
  drawText('DE SEGUROS PARA VEHÍCULOS R.L.', ML + 8, height - 45, 6, true, WHITE)

  drawText('RIF: J-31105096-6', ML, height - 60, 6, false, GREY)
  drawText('Inscrita en la Superintendencia de la Actividad Aseguradora', ML, height - 70, 5, false, GREY)
  drawText('bajo la credencial ACS-00005', ML, height - 78, 5, false, GREY)
  drawText('Autorización SUNACOOP N° 95198', ML, height - 86, 5, false, GREY)

  // Office box (top right)
  page.drawRectangle({ x: MR - 180, y: height - 95, width: 180, height: 75, borderColor: BLACK, borderWidth: 1, color: WHITE })
  drawText('Oficina: 002-M', MR - 170, height - 28, 7, true)
  drawText('Ramo: AUTOMÓVIL RCV', MR - 170, height - 42, 7, true)
  drawText('N° Póliza: ' + safe(data.policyNumber || data.verifyCode), MR - 170, height - 56, 7, true)
  drawText('N° Recibo: ' + safe(data.verifyCode), MR - 170, height - 70, 7, true)
  drawText('Tipo: PRIMER AÑO', MR - 170, height - 84, 7, true)

  // Title
  drawText('CUADRO PÓLIZA RECIBO DEL SEGURO DE', 120, height - 115, 10, true, NAVY)
  drawText('RESPONSABILIDAD CIVIL DE VEHÍCULOS', 115, height - 128, 10, true, NAVY)

  // === SECTION I: ASEGURADO ===
  drawSectionHeader(height - 155, 'I. Datos del Asegurado — Nombre(s) y Apellidos o Razón Social:')
  const asegName = safe(data.asegNombre || data.nombre) + ' ' + safe(data.asegApellido || data.apellido)
  drawText(asegName.trim(), 220, height - 163, 9, true)
  drawText('Cédula o Rif:', 420, height - 163, 7, false, GREY)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.asegCedula || data.cedula), 478, height - 163, 9, true)
  drawText('Carácter:', ML, height - 178, 7, false, GREY)
  drawText('Propietario', ML + 50, height - 178, 8)
  drawText('Datos del Registro:', 300, height - 178, 7, false, GREY)
  drawText('—', 390, height - 178, 8)

  // === SECTION II: TOMADOR ===
  drawSectionHeader(height - 200, 'II. Datos del Tomador')
  const tomName = safe(data.tomNombre || data.nombre) + ' ' + safe(data.tomApellido || data.apellido)

  page.drawRectangle({ x: ML, y: height - 228, width: CW, height: 14, color: LIGHT_GREY, borderColor: BLACK, borderWidth: 0.5 })
  drawText('NOMBRE', ML + 5, height - 223, 6, true)
  drawText('CÉDULA O RIF', ML + 200, height - 223, 6, true)
  drawText('SEXO', ML + 370, height - 223, 6, true)
  drawText('EDAD', ML + 430, height - 223, 6, true)

  drawText(tomName.trim(), ML + 5, height - 243, 8, true)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.tomCedula || data.cedula), ML + 200, height - 243, 8, true)
  drawText(safe(data.tomGenero || 'M').charAt(0).toUpperCase(), ML + 370, height - 243, 8, true)

  drawText('Dirección:', ML, height - 263, 7, false, GREY)
  const dir = [data.tomDireccion, data.tomMunicipio, data.tomEstado].filter(Boolean).join(', ')
  drawText(dir || '—', ML + 50, height - 263, 8, true)
  drawText('Teléfonos:', ML, height - 278, 7, false, GREY)
  drawText(safe(data.tomTelefono || data.telefono), ML + 50, height - 278, 8, true)
  drawText('Email:', ML + 300, height - 278, 7, false, GREY)
  drawText(safe(data.tomEmail || data.email) || '—', ML + 340, height - 278, 8, true)

  // === SECTION III: VIGENCIA ===
  drawSectionHeader(height - 300, 'III. Características del Seguro')

  drawText('Fecha de emisión:', ML, height - 320, 7, false, GREY)
  drawText(new Date().toLocaleDateString('es-VE'), ML + 75, height - 320, 8, true)
  drawText('Hora:', ML + 180, height - 320, 7, false, GREY)
  drawText(new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }), ML + 210, height - 320, 8, true)
  drawText('Vigencia Desde:', ML + 290, height - 320, 7, false, GREY)
  drawText(safe(data.vigenciaDesde) || '—', ML + 355, height - 320, 8, true)
  drawText('Hasta:', ML + 430, height - 320, 7, false, GREY)
  drawText(safe(data.vigenciaHasta) || '—', ML + 465, height - 320, 8, true)

  drawText('Frecuencia de pago:', ML, height - 338, 7, false, GREY)
  drawText('ANUAL', ML + 85, height - 338, 8, true)
  drawText('Recibo Desde:', ML + 200, height - 338, 7, false, GREY)
  drawText(safe(data.vigenciaDesde) || '—', ML + 265, height - 338, 8, true)
  drawText('Hasta:', ML + 370, height - 338, 7, false, GREY)
  drawText(safe(data.vigenciaHasta) || '—', ML + 405, height - 338, 8, true)
  drawText('Moneda: DÓLAR', ML + 470, height - 338, 7, true)

  // Vehicle section
  page.drawRectangle({ x: ML, y: height - 362, width: CW, height: 14, color: ORANGE })
  drawText('DESCRIPCIÓN DEL VEHÍCULO', ML + 5, height - 357, 7, true, WHITE)

  // Vehicle table
  page.drawRectangle({ x: ML, y: height - 440, width: CW, height: 78, color: LIGHT_GREY, borderColor: BLACK, borderWidth: 0.5 })

  drawField(ML + 5, height - 375, 'Marca:', safe(data.marca), 45)
  drawField(ML + 200, height - 375, 'Modelo:', safe(data.modelo || data.ano), 45)
  drawField(ML + 380, height - 375, 'Clase:', safe(data.clase || data.tipoVehiculo), 45)

  drawField(ML + 5, height - 395, 'Año:', safe(data.ano), 45)
  drawField(ML + 200, height - 395, 'Color:', safe(data.color), 45)
  drawField(ML + 380, height - 395, 'Uso:', safe(data.uso), 45)

  drawField(ML + 5, height - 415, 'Placa:', safe(data.placa), 45)
  drawField(ML + 200, height - 415, 'Puestos:', safe(data.cantidadPuestos), 50)
  drawField(ML + 380, height - 415, 'Cap. Carga:', safe(data.capacidadCarga) + (data.capacidadCarga ? 'Kg' : ''), 50)

  drawText('S/C:', ML + 5, height - 435, 7, false, GREY)
  drawText(safe(data.serialCarroceria) || '—', ML + 30, height - 435, 7, true)
  drawText('S/M:', ML + 280, height - 435, 7, false, GREY)
  drawText(safe(data.serialMotor) || '—', ML + 305, height - 435, 7, true)

  drawText('Tipo:', ML + 380, height - 435, 7, false, GREY)
  drawText(safe(data.tipo) || '—', ML + 415, height - 435, 8, true)

  // Asegurado name in vehicle section
  drawText('Nombre(s) y Apellidos:', ML, height - 458, 7, false, GREY)
  drawText(asegName.trim(), ML + 100, height - 458, 8, true)

  // === COBERTURAS ===
  drawSectionHeader(height - 475, 'Coberturas y Riesgos Cubiertos')

  page.drawRectangle({ x: ML, y: height - 510, width: CW, height: 14, color: ORANGE })
  drawText('Coberturas y Riesgos Cubiertos', ML + 5, height - 505, 6, true, WHITE)
  drawText('Recargos/Desc.', ML + 280, height - 505, 6, true, WHITE)
  drawText('Suma Asegurada', ML + 380, height - 505, 6, true, WHITE)
  drawText('Prima a Cobrar', ML + 480, height - 505, 6, true, WHITE)

  drawText('DAÑOS A COSA', ML + 5, height - 525, 7)
  drawText(safe(data.sumaAsegurada) || '2,308.32', ML + 380, height - 525, 8, true)
  drawText(safe(data.primaUsd || data.prima) || '—', ML + 480, height - 525, 8, true)

  drawText('DAÑOS A PERSONAS', ML + 5, height - 540, 7)
  drawText('2,891.17', ML + 380, height - 540, 8, true)
  drawText('0.00', ML + 480, height - 540, 8, true)

  // Total
  page.drawRectangle({ x: ML, y: height - 565, width: CW, height: 16, color: NAVY })
  drawText('TOTAL PRIMA:', ML + 340, height - 559, 8, true, WHITE)
  drawText(safe(data.primaUsd || data.prima) || '—', ML + 480, height - 559, 10, true, WHITE)

  // Plan
  drawText('Plan:', ML, height - 585, 7, false, GREY)
  drawText(safe(data.plan) || '—', ML + 30, height - 585, 8, true, 0 ? NAVY : NAVY, 400)

  // === SECTION IV: INTERMEDIARIOS ===
  drawSectionHeader(height - 605, 'IV. Intermediarios de la Actividad Aseguradora')

  page.drawRectangle({ x: ML, y: height - 635, width: CW, height: 14, color: LIGHT_GREY, borderColor: BLACK, borderWidth: 0.5 })
  drawText('Nombre de Intermediario', ML + 5, height - 630, 6, true)
  drawText('Código N°', ML + 200, height - 630, 6, true)
  drawText('Comisión', ML + 300, height - 630, 6, true)
  drawText('Tasa del día', ML + 420, height - 630, 6, true)

  drawText('M-002', ML + 5, height - 650, 8, true)
  drawText('002', ML + 200, height - 650, 8, true)
  drawText('766.86', ML + 420, height - 650, 8, true)

  // === SECTION V: PAGO ===
  drawSectionHeader(height - 670, 'V. Datos sobre el Pago Recibido')

  drawText('Fecha pago:', ML, height - 690, 7, false, GREY)
  drawText(safe(data.vigenciaDesde) || new Date().toLocaleDateString('es-VE'), ML + 55, height - 690, 8, true)
  drawText('Sucursal de Emisión:', ML + 250, height - 690, 7, false, GREY)
  drawText('002-Tlf: (0424)-257.22.72', ML + 340, height - 690, 8, true)

  // === SECTION VI: DECLARACIONES ===
  drawSectionHeader(height - 710, 'VI. Declaraciones')

  const declY = height - 730
  drawText('Yo, ' + tomName.trim() + ', venezolano(a), mayor de edad, titular de la cédula de identidad N°', ML, declY, 6, false, BLACK, 555)
  drawText(safe(data.tipoCedula || 'V') + '-' + safe(data.tomCedula || data.cedula) + ', declaro que los fondos utilizados para el pago de esta póliza', ML, declY - 12, 6, false, BLACK, 555)
  drawText('provienen de actividades lícitas, en cumplimiento de la Ley Orgánica contra la Delincuencia Organizada.', ML, declY - 24, 6, false, BLACK, 555)

  drawText('Domicilio Principal del ASEGURADOR: Av. Urdaneta, Esquina de Animas a Plaza España.', ML, declY - 42, 6, false, GREY, 555)
  drawText('Edif. Iberia, Piso 3, Ofc. 3-E. La Candelaria, Caracas. Tlf: 0212.564.31.36/564.67.27', ML, declY - 52, 6, false, GREY, 555)

  // Firmas
  page.drawRectangle({ x: ML, y: height - 810, width: CW, height: 50, borderColor: BLACK, borderWidth: 0.5, color: WHITE })

  drawText('Para Constancia se firma:', ML + 5, height - 765, 6, true)
  drawText('En Lugar: Sucursal Miranda', ML + 5, height - 778, 6)
  drawText('Fecha: ' + new Date().toLocaleDateString('es-VE'), ML + 5, height - 790, 6)

  drawText('Por Tomador:', ML + 170, height - 765, 6, true)
  drawText(tomName.trim(), ML + 170, height - 778, 6, true)
  drawText('C.I.: ' + safe(data.tipoCedula || 'V') + '-' + safe(data.tomCedula || data.cedula), ML + 170, height - 790, 6)

  drawText('Por Asegurado:', ML + 340, height - 765, 6, true)
  drawText(asegName.trim(), ML + 340, height - 778, 6, true)
  drawText('C.I.: ' + safe(data.tipoCedula || 'V') + '-' + safe(data.asegCedula || data.cedula), ML + 340, height - 790, 6)

  drawText('Por la Asociación:', ML + 460, height - 765, 6, true)
  drawText('Richard Gomez', ML + 460, height - 778, 6, true)
  drawText('Presidente', ML + 460, height - 790, 6)
  drawText('C.I.: V-6364679', ML + 460, height - 802, 5)

  // === QR CODE (top right, next to office box) ===
  const qr = await generatePolicyQr(data.verifyCode)
  const qrImg = await pdfDoc.embedPng(qr.buffer)
  const qrSize = 55
  page.drawImage(qrImg, {
    x: width - qrSize - 25,
    y: height - qrSize - 105,
    width: qrSize,
    height: qrSize,
  })
  drawText('Verificar', width - qrSize - 22, height - 120, 5, false, GREY)

  // === STATUS ===
  const status = (data.status || 'PENDIENTE').toUpperCase()
  const statusColor = status === 'APROBADA' ? rgb(0, 0.5, 0) : status === 'RECHAZADA' ? rgb(0.7, 0, 0) : rgb(0.8, 0.5, 0)
  page.drawText(status, { x: width / 2 - 35, y: 45, size: 14, font: helvBold, color: statusColor })

  // === FOOTER ===
  drawText('Nota: Este recibo solo es válido si está fechado y firmado por persona autorizada. Forma parte', ML, 30, 5, false, GREY, 555)
  drawText('integral de la Póliza junto con las Condiciones Generales, Particulares y Anexos.', ML, 22, 5, false, GREY, 555)
  drawText('Aprobado por la Superintendencia de la Actividad Aseguradora. Providencia N° SAA-09-7673 de fecha 11/11/2025.', ML, 14, 5, false, GREY, 555)
  drawText('Original', width - 50, 8, 7, true)

  const pdfBytes = await pdfDoc.save()
  let storageKey = ''
  try {
    storageKey = storage.keyFor(data.verifyCode, 'certificado.pdf', 'assets')
    await storage.put(storageKey, Buffer.from(pdfBytes), 'application/pdf')
  } catch { /* ignore */ }

  return { bytes: pdfBytes, storageKey, qrUrl: qr.url }
}
