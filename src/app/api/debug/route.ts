import { NextResponse } from 'next/server'
import { isD1, d1Query } from '@/lib/d1'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const errors: string[] = []
    errors.push(`isD1: ${isD1()}`)
    
    if (isD1()) {
      // Test simple queries
      try {
        const r = await d1Query('SELECT COUNT(*) as c FROM Policy')
        errors.push(`Policy count: ${JSON.stringify(r)}`)
      } catch (e) { errors.push(`Policy count error: ${(e as Error).message}`) }
      
      try {
        const r = await d1Query('SELECT COUNT(*) as c FROM ActivityLog')
        errors.push(`ActivityLog count: ${JSON.stringify(r)}`)
      } catch (e) { errors.push(`ActivityLog error: ${(e as Error).message}`) }
      
      // Test with params
      try {
        const r = await d1Query('SELECT COUNT(*) as c FROM Policy WHERE status = ?', ['PENDIENTE'])
        errors.push(`Pending count: ${JSON.stringify(r)}`)
      } catch (e) { errors.push(`Pending error: ${(e as Error).message}`) }
    }
    
    return NextResponse.json({ debug: errors })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message })
  }
}
