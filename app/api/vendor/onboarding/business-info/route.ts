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

    // Validate with Zod schema
    const validatedData = businessInfoSchema.parse(body)

    // Check if vendor already exists
    let vendor = await prisma.vendor.findUnique({
      where: { authId: user.id },
    })

    // Generate slug from business name
    let slug = generateSlug(validatedData.businessName)

    // Ensure slug is unique - auto-suggest alternatives
    let slugExists = await prisma.vendor.findUnique({
      where: { slug },
    })

    let slugCounter = 1
    while (slugExists && slugExists.id !== vendor?.id) {
      slug = `${generateSlug(validatedData.businessName)}-${slugCounter}`
      slugExists = await prisma.vendor.findUnique({
        where: { slug },
      })
      slugCounter++
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
    // Log detailed error server-side for debugging
    console.error('Business info onboarding error:', error)

    // Return user-friendly generic error to client for security
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
