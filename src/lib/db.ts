/**
 * Database client — supports both local SQLite (dev) and Cloudflare D1 (prod).
 * 
 * Prisma is loaded via eval-require to prevent bundlers from including it
 * in the Cloudflare Workers bundle (which would cause fs.readdir errors).
 */

import { isD1 } from './d1'

let _db: unknown = null

// Load Prisma only in local dev (not in Cloudflare D1)
if (!isD1()) {
  try {
    // eval-require prevents the bundler from resolving @prisma/client at build time
    const req = eval('require')
    const { PrismaClient } = req('@prisma/client')
    _db = new PrismaClient({ log: ['error', 'warn'] })
  } catch {
    /* Prisma not available */
  }
}

// In production (D1), db is a proxy that throws helpful errors
const _proxy = new Proxy({}, {
  get() {
    throw new Error('Prisma not available in production — use D1 queries')
  }
})

export const db = (_db || _proxy) as import('@prisma/client').PrismaClient
