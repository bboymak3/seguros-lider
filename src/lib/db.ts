import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

/**
 * Database client — supports both local SQLite (dev) and Cloudflare D1 (prod).
 *
 * In Cloudflare Workers/Pages, bindings are accessed via `getRequestContext()` from
 * `@opennextjs/cloudflare/next`. In dev, we use PrismaClient with SQLite directly.
 */

function getD1Binding(): D1Database | null {
  // Try @opennextjs/cloudflare getRequestContext first
  try {
    // Dynamic import to avoid breaking local dev
    const { getRequestContext } = require('@opennextjs/cloudflare/next')
    const env = getRequestContext().env
    const d1 = (env as Record<string, unknown>).DB as D1Database | undefined
    if (d1 && typeof d1.prepare === 'function') {
      return d1
    }
  } catch {
    /* not in Workers */
  }

  // Fallback: check globalThis
  try {
    const g = globalThis as Record<string, unknown>
    const d1 = (g.DB ?? g.__DB) as D1Database | undefined
    if (d1 && typeof d1.prepare === 'function') {
      return d1
    }
  } catch {
    /* not in Workers */
  }

  return null
}

function createClient() {
  const d1 = getD1Binding()
  if (d1) {
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter })
  }

  // Local development — use SQLite directly
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
