import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { businessMediaSchema } from '@/lib/validations'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate with Zod schema
    const validation = businessMediaSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { authId: user.id },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found. Please complete business info first.' },
        { status: 404 }
      )
    }

    // Update vendor with media URLs
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        logoUrl: validatedData.logoUrl || null,
        coverUrl: validatedData.coverUrl || null,
        coverUrls: validatedData.coverUrls || [],
      },
    })

    return NextResponse.json({ vendor: updatedVendor })
  } catch (error) {
    console.error('Media onboarding error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}