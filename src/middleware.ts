import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware — adds CORS headers to ALL API responses so the landing page
 * (app-seguros.pages.dev) can fetch from the Worker API.
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*'

  // Handle preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // For all other requests, add CORS header to the response
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export const config = {
  matcher: '/api/:path*',
}
