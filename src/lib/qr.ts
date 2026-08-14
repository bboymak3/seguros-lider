import QRCode from 'qrcode'
import { storage } from './storage'

/**
 * Generate a QR code PNG that links to the public verification page.
 * The QR encodes the absolute URL `/?v=<verifyCode>` which, when scanned,
 * opens the policy verification view.
 */
export async function generatePolicyQr(
  verifyCode: string,
  publicBaseUrl?: string
): Promise<{ buffer: Buffer; url: string; storageKey: string }> {
  const base =
    publicBaseUrl ||
    'https://app-seguro-activo.pages.dev'

  const targetUrl = `${base.replace(/\/$/, '')}/?v=${verifyCode}`

  const buffer = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    margin: 2,
    width: 600,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0b1f3a',
      light: '#ffffff',
    },
  })

  // Try to store in R2, but don't fail if storage is unavailable
  let storageKey = ''
  try {
    storageKey = storage.keyFor(verifyCode, 'qr.png', 'assets')
    await storage.put(storageKey, buffer, 'image/png')
  } catch {
    /* storage might not be available in Workers — QR still works in memory */
  }

  return {
    buffer,
    url: targetUrl,
    storageKey,
  }
}
