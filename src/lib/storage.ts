import { promises as fs } from 'fs'
import path from 'path'

/**
 * Storage abstraction — supports both local filesystem (dev) and Cloudflare R2 (prod).
 *
 * In development (Node.js), uses the local filesystem under ./storage/seguros/.
 * In production (Cloudflare Workers), uses the R2 bucket binding `BUCKET`.
 *
 * The bucket path convention is: my-emdash-media/seguros/{verifyCode}/...
 */

const BUCKET_PREFIX = 'my-emdash-media/seguros/'

// Detect if we're running in Cloudflare Workers (has R2 binding)
function getR2Bucket(): R2Bucket | null {
  // Try @opennextjs/cloudflare getRequestContext first
  try {
    const { getRequestContext } = require('@opennextjs/cloudflare/next')
    const env = getRequestContext().env
    const bucket = (env as Record<string, unknown>).BUCKET as R2Bucket | undefined
    if (bucket && typeof bucket.put === 'function') {
      return bucket
    }
  } catch {
    /* not in Workers */
  }

  // Fallback: check globalThis
  try {
    const g = globalThis as Record<string, unknown>
    const bucket = (g.BUCKET ?? g.__BUCKET) as R2Bucket | undefined
    if (bucket && typeof bucket.put === 'function') {
      return bucket
    }
  } catch {
    /* not in Workers */
  }
  return null
}

const isR2 = typeof globalThis !== 'undefined' && getR2Bucket() !== null

// Local filesystem root (dev only)
const BUCKET_ROOT = path.join(process.cwd(), 'storage', 'seguros')

function resolvePath(key: string): string {
  let clean = key.replace(/^\/+/, '')
  if (clean.startsWith(BUCKET_PREFIX)) {
    clean = clean.slice(BUCKET_PREFIX.length)
  }
  clean = clean.split('/').filter(Boolean).join('/')
  return path.join(BUCKET_ROOT, clean)
}

function toKey(localPath: string): string {
  const rel = path.relative(BUCKET_ROOT, localPath).split(path.sep).join('/')
  return BUCKET_PREFIX + rel
}

function stripPrefix(key: string): string {
  return key.startsWith(BUCKET_PREFIX)
    ? key.slice(BUCKET_PREFIX.length)
    : key.replace(/^\/+/, '')
}

export interface StoredFile {
  key: string
  size: number
  mimeType: string
}

export const storage = {
  async put(
    key: string,
    data: Buffer | Uint8Array | ArrayBuffer,
    mimeType = 'application/octet-stream'
  ): Promise<StoredFile> {
    const cleanKey = stripPrefix(key)

    // R2 path (Cloudflare Workers)
    const bucket = getR2Bucket()
    if (bucket) {
      const buf = data instanceof ArrayBuffer ? data : new Uint8Array(data)
      await bucket.put(cleanKey, buf, {
        httpMetadata: { contentType: mimeType },
      })
      return {
        key: BUCKET_PREFIX + cleanKey,
        size: buf.byteLength,
        mimeType,
      }
    }

    // Filesystem path (local dev)
    const fullPath = resolvePath(key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as Uint8Array)
    await fs.writeFile(fullPath, buf)
    return {
      key: toKey(fullPath),
      size: buf.length,
      mimeType,
    }
  },

  async get(key: string): Promise<Buffer | null> {
    const cleanKey = stripPrefix(key)

    // R2 path
    const bucket = getR2Bucket()
    if (bucket) {
      const obj = await bucket.get(cleanKey)
      if (!obj) return null
      const arrayBuf = await obj.arrayBuffer()
      return Buffer.from(arrayBuf)
    }

    // Filesystem path
    try {
      return await fs.readFile(resolvePath(key))
    } catch {
      return null
    }
  },

  async delete(key: string): Promise<void> {
    const cleanKey = stripPrefix(key)

    // R2 path
    const bucket = getR2Bucket()
    if (bucket) {
      await bucket.delete(cleanKey)
      return
    }

    // Filesystem path
    try {
      await fs.unlink(resolvePath(key))
    } catch {
      /* ignore missing */
    }
  },

  getSignedUrl(key: string): string {
    const rel = stripPrefix(key)
    return `/api/files/${rel.split('/').map(encodeURIComponent).join('/')}`
  },

  keyFor(verifyCode: string, fileName: string, subfolder = ''): string {
    const base = `${BUCKET_PREFIX}${verifyCode}/`
    const folder = subfolder ? `${subfolder}/` : ''
    return `${base}${folder}${fileName}`
  },
}
