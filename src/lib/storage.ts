import { promises as fs } from 'fs'
import path from 'path'

/**
 * Storage abstraction.
 *
 * In this sandbox we use the local filesystem to emulate Cloudflare R2.
 * The "bucket" root maps to ./storage/seguros (mirroring the R2 key prefix
 * `my-emdash-media/seguros/` requested in the spec).
 *
 * To migrate to R2, swap the implementations of `put`, `get`, `delete` and
 * `getSignedUrl` with the Cloudflare R2 S3-compatible API (or bindings). The
 * call sites do not need to change.
 */

const BUCKET_ROOT = path.join(process.cwd(), 'storage', 'seguros')

const BUCKET_PREFIX = 'my-emdash-media/seguros/'

/** Normalise a logical bucket key into a safe local path. */
function resolvePath(key: string): string {
  // strip leading prefix if caller passed full R2-style key
  let clean = key.replace(/^\/+/, '')
  if (clean.startsWith(BUCKET_PREFIX)) {
    clean = clean.slice(BUCKET_PREFIX.length)
  }
  // prevent path traversal
  clean = clean.split('/').filter(Boolean).join('/')
  return path.join(BUCKET_ROOT, clean)
}

/** Convert a local path back into a logical bucket key. */
function toKey(localPath: string): string {
  const rel = path.relative(BUCKET_ROOT, localPath).split(path.sep).join('/')
  return BUCKET_PREFIX + rel
}

export interface StoredFile {
  key: string
  size: number
  mimeType: string
}

export const storage = {
  async put(
    key: string,
    data: Buffer | Uint8Array,
    mimeType = 'application/octet-stream'
  ): Promise<StoredFile> {
    const fullPath = resolvePath(key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    await fs.writeFile(fullPath, buf)
    return {
      key: toKey(fullPath),
      size: buf.length,
      mimeType,
    }
  },

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(resolvePath(key))
    } catch {
      return null
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(resolvePath(key))
    } catch {
      /* ignore missing */
    }
  },

  /** In R2 this would return a presigned URL; here we return an API route. */
  getSignedUrl(key: string): string {
    const rel = key.startsWith(BUCKET_PREFIX)
      ? key.slice(BUCKET_PREFIX.length)
      : key
    return `/api/files/${rel.split('/').map(encodeURIComponent).join('/')}`
  },

  keyFor(verifyCode: string, fileName: string, subfolder = ''): string {
    const base = `${BUCKET_PREFIX}${verifyCode}/`
    const folder = subfolder ? `${subfolder}/` : ''
    return `${base}${folder}${fileName}`
  },
}
