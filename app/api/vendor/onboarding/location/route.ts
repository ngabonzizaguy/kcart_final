import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { businessLocationSchema } from '@/lib/validations'

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
    const validation = businessLocationSchema.safeParse(body)
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
        { error: 'Vendor not found. Please complete previous steps first.' },
        { status: 404 }
      )
    }

    // Update vendor with location data
    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        address: validatedData.address,
        addressRw: validatedData.addressRw || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        deliveryRange: validatedData.deliveryRange || 5,
      },
    })

    return NextResponse.json({ vendor: updatedVendor })
  } catch (error) {
    console.error('Location onboarding error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
