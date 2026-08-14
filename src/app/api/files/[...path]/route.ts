import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ path: string[] }> }

/**
 * GET /api/files/{verifyCode}/{subfolder}/{file}
 *
 * Serves stored objects from the (local-R2-emulated) bucket. In production on
 * Cloudflare this route would proxy to an R2 presigned URL or a Worker binding.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { path } = await params
  if (!path || path.length === 0) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  // path segments are URL-decoded by the framework; rejoin into a bucket key
  const key = 'my-emdash-media/seguros/' + path.map(decodeURIComponent).join('/')

  const buf = await storage.get(key)
  if (!buf) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const seg = path[path.length - 1].toLowerCase()
  let mime = 'application/octet-stream'
  if (seg.endsWith('.png')) mime = 'image/png'
  else if (seg.endsWith('.jpg') || seg.endsWith('.jpeg')) mime = 'image/jpeg'
  else if (seg.endsWith('.webp')) mime = 'image/webp'
  else if (seg.endsWith('.pdf')) mime = 'application/pdf'

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
