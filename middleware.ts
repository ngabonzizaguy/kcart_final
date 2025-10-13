import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/signup']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Storefront routes (dynamic vendor pages)
  const isStorefront = pathname.match(/^\/[a-z0-9-]+$/) && !publicRoutes.includes(pathname)
  const isCheckout = pathname.match(/^\/[a-z0-9-]+\/checkout$/)
  const isOrderTracking = pathname.match(/^\/orders\/[A-Z0-9-]+$/)

  // Allow public access to storefronts, checkout, and order tracking
  if (isStorefront || isCheckout || isOrderTracking) {
    return supabaseResponse
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
