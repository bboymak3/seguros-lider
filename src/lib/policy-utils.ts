import { db } from './db'

/** Generate a short, unique, human-friendly verify code (like 576501). */
export async function generateVerifyCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 899999))
    const exists = await db.policy.findUnique({ where: { verifyCode: code } })
    if (!exists) return code
  }
  // fallback with timestamp suffix
  return String(Date.now()).slice(-6)
}

export function formatPolicyNumber(n: number): string {
  return String(n).padStart(6, '0')
}

export async function nextPolicyNumber(): Promise<string> {
  const count = await db.policy.count({ where: { status: 'APROBADA' } })
  return formatPolicyNumber(count + 1)
}

export const ACCEPTED_DOC_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const ACCEPTED_DOC_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']

export function validateDocFile(file: File): string | null {
  if (!ACCEPTED_DOC_MIMES.includes(file.type)) {
    return `Formato no permitido: ${file.type}. Use JPG, PNG, WEBP o PDF.`
  }
  // 10 MB cap
  if (file.size > 10 * 1024 * 1024) {
    return 'El archivo excede el tamaño máximo de 10 MB.'
  }
  return null
}

export function safeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
}
