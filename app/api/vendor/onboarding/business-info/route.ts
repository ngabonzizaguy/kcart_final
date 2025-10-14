import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { businessInfoSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'

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

    // Validate with Zod schema - specific error messages
    const validation = businessInfoSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if vendor already exists
    let vendor = await prisma.vendor.findUnique({
      where: { authId: user.id },
    })

    // Generate slug from business name
    let slug = generateSlug(validatedData.businessName)

    // Check if slug is already taken by another vendor
    const slugExists = await prisma.vendor.findUnique({
      where: { slug },
    })

    if (slugExists && slugExists.id !== vendor?.id) {
      return NextResponse.json(
        { error: 'A business with this name already exists. Please choose a different name.' },
        { status: 400 }
      )
    }

    if (vendor) {
      // Update existing vendor
      vendor = await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          businessName: validatedData.businessName,
          businessNameRw: validatedData.businessNameRw,
          businessType: validatedData.businessType,
          description: validatedData.description,
          descriptionRw: validatedData.descriptionRw,
          slug,
        },
      })
    } else {
      // Create new vendor
      vendor = await prisma.vendor.create({
        data: {
          authId: user.id,
          email: user.email!,
          businessName: validatedData.businessName,
          businessNameRw: validatedData.businessNameRw,
          businessType: validatedData.businessType,
          description: validatedData.description,
          descriptionRw: validatedData.descriptionRw,
          slug,
          businessPhone: '', // Will be set in later onboarding step
          isSetupComplete: false,
        },
      })
    }

    // Return full vendor object
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Business info onboarding error:', error)

    // Return specific error message
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
