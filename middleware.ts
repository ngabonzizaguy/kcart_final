import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const pathname = request.nextUrl.pathname

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/signup', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Check if this is an admin route FIRST (before storefront check)
  const isAdminRoute = pathname.startsWith('/admin')

  // Storefront routes (dynamic vendor pages) - EXCLUDE admin routes
  const isStorefront = pathname.match(/^\/[a-z0-9-]+$/) && !publicRoutes.includes(pathname) && !isAdminRoute
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

  // Admin route protection - check BEFORE general auth redirect
  if (pathname.startsWith('/admin')) {
    // Must be logged in first
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Check if user is an admin via Edge-compatible API route
      const adminCheckUrl = new URL('/api/admin/check', request.url)
      const adminCheckResponse = await fetch(adminCheckUrl, {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      })

      const adminCheckData = await adminCheckResponse.json()

      if (!adminCheckData.isAdmin) {
        // Not an admin, redirect to unauthorized
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Admin check passed, allow through
    return supabaseResponse
  }

  // Redirect unauthenticated users to login (for non-admin routes)
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