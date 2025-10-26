import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/roleCheck'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

/**
 * Edge-compatible admin check API
 * Returns admin status for the current authenticated user
 * Used by middleware to verify admin access
 */
export async function GET() {
  try {
    const adminStatus = await isAdmin()

    return NextResponse.json({ isAdmin: adminStatus })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { isAdmin: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
