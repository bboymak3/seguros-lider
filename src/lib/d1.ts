/**
 * D1 Database adapter — uses raw SQL queries on Cloudflare D1.
 * Falls back to Prisma on local dev.
 */

function getD1(): D1Database | null {
  try {
    const g = globalThis as Record<string, unknown>
    const d1 = g.DB as D1Database | undefined
    if (d1 && typeof d1.prepare === 'function') return d1
  } catch { /* ignore */ }
  try {
    const { getRequestContext } = require('@opennextjs/cloudflare/next')
    const env = getRequestContext().env
    const d1 = (env as Record<string, unknown>).DB as D1Database | undefined
    if (d1 && typeof d1.prepare === 'function') return d1
  } catch { /* ignore */ }
  return null
}

export const isD1 = () => getD1() !== null

export async function d1Query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const d1 = getD1()
  if (!d1) throw new Error('D1 not available')
  const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql)
  const result = await stmt.all()
  return (result.results || []) as T[]
}

export async function d1Run(sql: string, params: unknown[] = []): Promise<void> {
  const d1 = getD1()
  if (!d1) throw new Error('D1 not available')
  const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql)
  await stmt.run()
}

export async function d1First<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await d1Query<T>(sql, params)
  return rows[0] || null
}
