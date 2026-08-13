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
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'

  // Keep query-only so it stays on the single / route.
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

  const storageKey = storage.keyFor(verifyCode, 'qr.png', 'assets')
  await storage.put(storageKey, buffer, 'image/png')

  return {
    buffer,
    url: targetUrl,
    storageKey,
  }
}
