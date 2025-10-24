import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { authId: user.id },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const categories = await prisma.category.findMany({
      where: { vendorId: vendor.id },
      include: {
        _count: { select: { menuItems: true } }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const vendor = await prisma.vendor.findUnique({
      where: { authId: user.id },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate with Zod schema
    const validation = categorySchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Get max sortOrder to append new category at the end
    const maxSortOrderCategory = await prisma.category.findFirst({
      where: { vendorId: vendor.id },
      orderBy: { sortOrder: 'desc' }
    })

    const sortOrder = maxSortOrderCategory ? maxSortOrderCategory.sortOrder + 1 : 0

    // Create category
    const category = await prisma.category.create({
      data: {
        vendorId: vendor.id,
        name: validatedData.name,
        nameRw: validatedData.nameRw,
        description: validatedData.description,
        descriptionRw: validatedData.descriptionRw,
        sortOrder,
      },
      include: {
        _count: { select: { menuItems: true } }
      }
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}