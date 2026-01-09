import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'


const DEMO_MODE = false

// Auth routes - jahan logged in users ko nahi jana chahiye
const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]

// Completely public routes - root path (/)
const PUBLIC_ROUTES = ['/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (DEMO_MODE) {
    return NextResponse.next()
  }

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Normalize path - remove trailing slash except for root
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname

  // Check if current route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route =>
    normalizedPath === route || normalizedPath.startsWith(route + '/')
  )

  // Check if current route is public route (only /)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    normalizedPath === route || (route === '/' && pathname === '/')
  )

  // Get token from cookies
  const token = request.cookies.get('idToken')?.value
  let user = null

  // Verify token if it exists
  if (token) {
    user = await verifyToken(token)
    console.log('Token Verification Result:', user)

    // If token is invalid, delete it
    if (!user) {
      console.log('Invalid token found, deleting cookie')
    }
  }

  // CASE 1: User is on root path (/)
  if (isPublicRoute) {
    // If user has valid token, redirect to dashboard
    if (user) {
      console.log('User is authenticated on /, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // No valid token, show landing page
    console.log('Public route (/) - allowing access to landing page')
    return NextResponse.next()
  }

  // CASE 2: User is on auth routes (/login, /signup, etc.)
  if (isAuthRoute) {
    // If user has valid token, redirect to dashboard
    if (user) {
      console.log('User is authenticated, redirecting from auth route to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // No valid token, allow access to auth route
    console.log('No token, allowing access to auth route')
    return NextResponse.next()
  }

  // CASE 3: Protected routes (dashboard, etc.)
  // If no token or invalid token, redirect to login
  if (!token || !user) {
    console.log('No valid token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', normalizedPath)
    const response = NextResponse.redirect(loginUrl)
    if (token && !user) {
      // Delete invalid token
      response.cookies.delete('idToken')
    }
    return response
  }

  // User has valid token and is on protected route
  // Add user info to headers for server components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.cognitoUserId)
  requestHeaders.set('x-user-email', user.email)
  requestHeaders.set('x-user-role', user.role)
  if (user.name) {
    requestHeaders.set('x-user-name', user.name)
  }

  console.log('Valid token, allowing access to protected route')
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}