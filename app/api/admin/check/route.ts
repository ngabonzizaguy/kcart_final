import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header (passed by middleware)
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin in database
    const admin = await prisma.admin.findUnique({
      where: { authId: userId },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
    }

    // Update last login timestamp (non-blocking)
    prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {
      // Silently fail - not critical
    })

    // Return success
    return NextResponse.json({ 
      isAdmin: true,
      role: admin.role 
    })

  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}