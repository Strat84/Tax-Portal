import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth/jwt'


const DEMO_MODE = false

// Public routes
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

  if (DEMO_MODE) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    const normalizedPath = pathname.endsWith('/') && pathname !== '/' 
      ? pathname.slice(0, -1) 
      : pathname;
      
    if (route === '/') return pathname === '/';
    return normalizedPath === route || normalizedPath.startsWith(route + '/');
  });

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
  console.log('Token Verification Result:', user)

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('idToken')
    return response
  }

  // Agar user login page pe hai aur uska valid token hai, toh usko dashboard pe redirect karo
  console.log("PATH NAME TRIGGER ::",pathname)
  if (pathname === '/login' && user) {
    console.log("USER IN LINE NO 66 ---------------------", user)
    console.log("request url ::::::: ", request.url)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // User info headers mein add karo
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}