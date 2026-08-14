import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { storage } from './storage'
import { generatePolicyQr } from './qr'

/**
 * Generate the filled insurance certificate PDF for a policy.
 *
 * Design note: the spec references a clean template (`pdfclean`) that has a
 * green box where the QR should be placed, and a filled example (`pdflleno`).
 * Since we cannot fetch the external template here, we generate a polished
 * certificate from scratch with pdf-lib that follows the same layout:
 *  - Header band with company / policy number
 *  - Cliente (personal) data block
 *  - Vehiculo data block
 *  - Cobertura block
 *  - A highlighted green box (bottom-right) containing the QR that links to
 *    the public verification page (/?v=<code>)
 *
 * The same approach works when an upstream template is available: load it with
 * `PDFDocument.load(templateBytes)` and `copyPages` instead of `addPage`.
 */

export interface PolicyPdfData {
  verifyCode: string
  policyNumber?: string | null
  nombre: string
  apellido?: string | null
  cedula: string
  tipoCedula?: string | null
  fechaNacimiento?: string | null
  nacionalidad?: string | null
  estadoCivil?: string | null
  sexo?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
  ocupacion?: string | null
  tipoVehiculo?: string | null
  marca?: string | null
  modelo?: string | null
  ano?: string | null
  placa?: string | null
  color?: string | null
  serialCarroceria?: string | null
  serialMotor?: string | null
  uso?: string | null
  capacidad?: string | null
  clase?: string | null
  tipo?: string | null
  tipoCobertura?: string | null
  compania?: string | null
  plan?: string | null
  prima?: string | null
  sumaAsegurada?: string | null
  deducible?: string | null
  vigenciaDesde?: string | null
  vigenciaHasta?: string | null
  frecuenciaPago?: string | null
  status?: string
  createdAt?: Date | string
}

const NAVY = rgb(0.043, 0.122, 0.227)
const GOLD = rgb(0.78, 0.631, 0.212)
const GREEN = rgb(0.094, 0.502, 0.275)
const LIGHT_GREEN = rgb(0.875, 0.953, 0.886)
const GREY = rgb(0.466, 0.49, 0.529)
const LIGHT_GREY = rgb(0.949, 0.953, 0.961)
const BORDER = rgb(0.804, 0.831, 0.882)

function safe(v?: string | null): string {
  return v && String(v).trim().length > 0 ? String(v) : '—'
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

  // ---- Top navy header band ----
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: NAVY,
  })
  // gold accent line
  page.drawRectangle({
    x: 0,
    y: height - 114,
    width,
    height: 4,
    color: GOLD,
  })

  page.drawText('SEGUROS LIDER', {
    x: 40,
    y: height - 50,
    size: 24,
    font: helvBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Certificado de Póliza de Seguro de Vehículo', {
    x: 40,
    y: height - 72,
    size: 11,
    font: helvOblique,
    color: GOLD,
  })
  page.drawText('RIF J-XXXXXXXX-X', {
    x: 40,
    y: height - 90,
    size: 9,
    font: helv,
    color: rgb(0.78, 0.82, 0.9),
  })

  // Policy number block (top right)
  const pn = data.policyNumber || data.verifyCode
  page.drawRectangle({
    x: width - 200,
    y: height - 95,
    width: 160,
    height: 60,
    color: rgb(1, 1, 1),
    borderColor: GOLD,
    borderWidth: 1,
  })
  page.drawText('PÓLIZA N°', {
    x: width - 190,
    y: height - 50,
    size: 9,
    font: helv,
    color: GREY,
  })
  page.drawText(String(pn), {
    x: width - 190,
    y: height - 68,
    size: 18,
    font: helvBold,
    color: NAVY,
  })
  page.drawText(`Código: ${data.verifyCode}`, {
    x: width - 190,
    y: height - 85,
    size: 8,
    font: helv,
    color: GREY,
  })

  // ---- Status banner ----
  const status = (data.status || 'PENDIENTE').toUpperCase()
  const statusColor =
    status === 'APROBADA'
      ? GREEN
      : status === 'RECHAZADA'
        ? rgb(0.7, 0.15, 0.15)
        : GOLD
  page.drawRectangle({ x: 0, y: height - 138, width, height: 20, color: statusColor })
  const statusLabel =
    status === 'APROBADA'
      ? 'PÓLIZA APROBADA — VIGENTE'
      : status === 'RECHAZADA'
        ? 'SOLICITUD RECHAZADA'
        : status === 'ANULADA'
          ? 'PÓLIZA ANULADA'
          : 'SOLICITUD EN PROCESO — PENDIENTE DE APROBACIÓN'
  page.drawText(statusLabel, {
    x: 40,
    y: height - 132,
    size: 10,
    font: helvBold,
    color: rgb(1, 1, 1),
  })

  // ---- Helper to draw a section card ----
  let cursorY = height - 158
  const marginX = 40
  const contentWidth = width - marginX * 2

  function sectionTitle(title: string, y: number) {
    page.drawRectangle({
      x: marginX,
      y: y - 14,
      width: contentWidth,
      height: 16,
      color: NAVY,
    })
    page.drawText(title, {
      x: marginX + 8,
      y: y - 9,
      size: 10,
      font: helvBold,
      color: rgb(1, 1, 1),
    })
    return y - 22
  }

  function fieldRow(
    y: number,
    label: string,
    value: string,
    x: number,
    w: number
  ): number {
    page.drawText(label.toUpperCase(), {
      x,
      y: y - 8,
      size: 7,
      font: helv,
      color: GREY,
    })
    page.drawText(safe(value), {
      x,
      y: y - 20,
      size: 10,
      font: helvBold,
      color: NAVY,
      maxWidth: w - 8,
    })
    return y - 28
  }

  function cardBox(y: number, h: number) {
    page.drawRectangle({
      x: marginX,
      y: y - h,
      width: contentWidth,
      height: h,
      color: LIGHT_GREY,
      borderColor: BORDER,
      borderWidth: 0.5,
    })
  }

  // ---------- DATOS DEL CLIENTE ----------
  cursorY = sectionTitle('DATOS DEL CLIENTO (TOMADOR)', cursorY)
  cardBox(cursorY, 84)
  const colW = contentWidth / 2
  let y = cursorY - 4
  y = fieldRow(y, 'Nombre / Razón Social', `${data.nombre} ${safe(data.apellido)}`, marginX + 6, colW)
  y = fieldRow(y, 'Cédula / RIF', `${data.tipoCedula ? data.tipoCedula + '-' : ''}${data.cedula}`, marginX + 6, colW)
  y = fieldRow(y, 'Fecha de Nacimiento', data.fechaNacimiento, marginX + 6, colW)
  y = fieldRow(y, 'Teléfono', data.telefono, marginX + 6, colW)
  y = fieldRow(y, 'Correo Electrónico', data.email, marginX + 6, colW)
  y = fieldRow(y, 'Dirección', data.direccion, marginX + 6, colW)

  let y2 = cursorY - 4
  y2 = fieldRow(y2, 'Nacionalidad', data.nacionalidad, marginX + colW, colW)
  y2 = fieldRow(y2, 'Estado Civil', data.estadoCivil, marginX + colW, colW)
  y2 = fieldRow(y2, 'Sexo', data.sexo, marginX + colW, colW)
  y2 = fieldRow(y2, 'Ocupación', data.ocupacion, marginX + colW, colW)
  y2 = fieldRow(y2, 'Ciudad', data.ciudad, marginX + colW, colW)
  y2 = fieldRow(y2, 'Estado', data.estado, marginX + colW, colW)

  cursorY -= 92

  // ---------- DATOS DEL VEHÍCULO ----------
  cursorY = sectionTitle('DATOS DEL VEHÍCULO ASEGURADO', cursorY)
  cardBox(cursorY, 84)
  y = cursorY - 4
  y = fieldRow(y, 'Tipo', data.tipoVehiculo, marginX + 6, colW)
  y = fieldRow(y, 'Marca', data.marca, marginX + 6, colW)
  y = fieldRow(y, 'Modelo', data.modelo, marginX + 6, colW)
  y = fieldRow(y, 'Año', data.ano, marginX + 6, colW)
  y = fieldRow(y, 'Placa', data.placa, marginX + 6, colW)
  y = fieldRow(y, 'Color', data.color, marginX + 6, colW)

  y2 = cursorY - 4
  y2 = fieldRow(y2, 'Clase', data.clase, marginX + colW, colW)
  y2 = fieldRow(y2, 'Uso', data.uso, marginX + colW, colW)
  y2 = fieldRow(y2, 'Capacidad', data.capacidad, marginX + colW, colW)
  y2 = fieldRow(y2, 'Serial de Carrocería', data.serialCarroceria, marginX + colW, colW)
  y2 = fieldRow(y2, 'Serial de Motor', data.serialMotor, marginX + colW, colW)
  y2 = fieldRow(y2, 'Tipo', data.tipo, marginX + colW, colW)

  cursorY -= 92

  // ---------- COBERTURA ----------
  cursorY = sectionTitle('COBERTURA Y CONDICIONES', cursorY)
  cardBox(cursorY, 70)
  y = cursorY - 4
  y = fieldRow(y, 'Aseguradora', data.compania, marginX + 6, colW)
  y = fieldRow(y, 'Plan', data.plan, marginX + 6, colW)
  y = fieldRow(y, 'Tipo de Cobertura', data.tipoCobertura, marginX + 6, colW)
  y = fieldRow(y, 'Suma Asegurada', data.sumaAsegurada, marginX + 6, colW)

  y2 = cursorY - 4
  y2 = fieldRow(y2, 'Prima', data.prima, marginX + colW, colW)
  y2 = fieldRow(y2, 'Deducible', data.deducible, marginX + colW, colW)
  y2 = fieldRow(y2, 'Vigencia Desde', data.vigenciaDesde, marginX + colW, colW)
  y2 = fieldRow(y2, 'Vigencia Hasta', data.vigenciaHasta, marginX + colW, colW)
  y2 = fieldRow(y2, 'Frecuencia de Pago', data.frecuenciaPago, marginX + colW, colW)

  cursorY -= 78

  // ---- QR box (green) bottom-right ----
  const qrSize = 130
  const boxW = 230
  const boxH = 160
  const boxX = width - boxW - 30
  const boxY = 40

  // green box background
  page.drawRectangle({
    x: boxX,
    y: boxY,
    width: boxW,
    height: boxH,
    color: LIGHT_GREEN,
    borderColor: GREEN,
    borderWidth: 1.5,
  })
  page.drawText('ESCANEE PARA VERIFICAR', {
    x: boxX + 12,
    y: boxY + boxH - 18,
    size: 9,
    font: helvBold,
    color: GREEN,
  })
  page.drawText('Validez del certificado', {
    x: boxX + 12,
    y: boxY + boxH - 30,
    size: 7,
    font: helv,
    color: GREY,
  })

  // Generate + embed QR
  const qr = await generatePolicyQr(data.verifyCode)
  const qrImg = await pdfDoc.embedPng(qr.buffer)
  page.drawImage(qrImg, {
    x: boxX + (boxW - qrSize) / 2,
    y: boxY + 16,
    width: qrSize,
    height: qrSize,
  })

  // ---- Signature area (bottom-left) ----
  page.drawText('_____________________________', {
    x: marginX,
    y: 90,
    size: 10,
    font: helv,
    color: NAVY,
  })
  page.drawText('Firma del Asegurado', {
    x: marginX + 10,
    y: 78,
    size: 9,
    font: helv,
    color: GREY,
  })

  // ---- Footer ----
  page.drawRectangle({ x: 0, y: 0, width, height: 28, color: NAVY })
  page.drawText(
    `Emitido: ${new Date().toLocaleString('es-VE')}  •  Verificación en línea: ?v=${data.verifyCode}`,
    {
      x: marginX,
      y: 10,
      size: 8,
      font: helv,
      color: rgb(0.78, 0.82, 0.9),
    }
  )
  page.drawText('Documento generado por sistema Seguros Líder', {
    x: width - 230,
    y: 10,
    size: 8,
    font: helvOblique,
    color: GOLD,
  })

  // Watermark
  page.drawText(status, {
    x: width / 2 - 80,
    y: height / 2,
    size: 60,
    font: helvBold,
    color: rgb(0.85, 0.85, 0.85),
    opacity: 0.12,
    rotate: degrees(45),
  })

  const pdfBytes = await pdfDoc.save()
  const storageKey = storage.keyFor(data.verifyCode, 'certificado.pdf', 'assets')
  await storage.put(storageKey, Buffer.from(pdfBytes), 'application/pdf')

  return {
    bytes: pdfBytes,
    storageKey,
    qrUrl: qr.url,
  }
}
