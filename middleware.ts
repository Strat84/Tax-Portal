import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'

// TEMPORARY: Set to true to bypass authentication for UI testing
// Set to false for production behavior where middleware enforces auth
const DEMO_MODE = false

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]

// Define role-based route access
const ROUTE_ACCESS: Record<string, Array<string>> = {
  '/admin': ['admin'],
  '/tax-pro': ['admin', 'tax_pro'],
  '/client': ['admin', 'tax_pro', 'client'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // DEMO MODE: Allow all routes
  if (DEMO_MODE) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Get token from cookie or Authorization header
  const token = request.cookies.get('idToken')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

  console.log("check token in middleware:")
  // If user hits a public/auth route and already has a valid token, redirect to dashboard
  let verifiedUser = null
  if (token) {
    verifiedUser = await verifyToken(token)
  }

  // Check if current path is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/' // Exact match for home page only
    }
    return pathname === route || pathname.startsWith(route + '/')
  })

  if (isPublicRoute) {
    if (verifiedUser) {
      // already authenticated -> send to dashboard
      const to = new URL('/dashboard', request.url)
      return NextResponse.redirect(to)
    }
    return NextResponse.next()
  }

  if (!token) {
    // No token, redirect to login
    const loginUrl = new URL('/login', request.url)
    if (!pathname.startsWith('/login')) {
      loginUrl.searchParams.set('redirect', pathname)
    }
    
    return NextResponse.redirect(loginUrl)
  }

  // Verify token (if not verified above)
  const user = verifiedUser ?? (await verifyToken(token))

  if (!user) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url)
    if (!pathname.startsWith('/login')) {
      loginUrl.searchParams.set('redirect', pathname)
    }

    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('idToken')
    return response
  }

  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(user.role)) {
        // User doesn't have access to this route
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  // Add user info to headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.cognitoUserId)
  requestHeaders.set('x-user-email', user.email)
  requestHeaders.set('x-user-role', user.role)
  if (user.name) {
    requestHeaders.set('x-user-name', user.name)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
