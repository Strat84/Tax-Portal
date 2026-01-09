import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

export const runtime = 'nodejs' // 🔴 VERY IMPORTANT

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ Always ignore Next internal & static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const normalizedPath =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    route === '/'
      ? normalizedPath === '/'
      : normalizedPath === route || normalizedPath.startsWith(route + '/')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get('idToken')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = await verifyToken(token)

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)

    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete('idToken')
    return res
  }

  // ✅ VERY IMPORTANT: allow request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
