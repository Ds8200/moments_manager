import { type NextRequest, NextResponse } from 'next/server'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000'

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? ''
  const isMainDomain =
    host === APP_DOMAIN ||
    host === `www.${APP_DOMAIN}` ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')

  if (isMainDomain) {
    return NextResponse.next()
  }

  // Subdomain: extract slug and forward as header for server components
  const slug = host.split('.')[0]
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-org-slug', slug)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
