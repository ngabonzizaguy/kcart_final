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

    const menuItems = await prisma.menuItem.findMany({
      where: { vendorId: vendor.id },
      include: { category: true },
      orderBy: [
        { categoryId: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    return NextResponse.json({ menuItems })
  } catch (error: any) {
    console.error('Get menu items error:', error)
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
    const validation = menuItemSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Verify category exists and belongs to vendor
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    })

    if (!category || category.vendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Get max sortOrder in this category to append new item at the end
    const maxSortOrderItem = await prisma.menuItem.findFirst({
      where: {
        vendorId: vendor.id,
        categoryId: validatedData.categoryId
      },
      orderBy: { sortOrder: 'desc' }
    })

    const sortOrder = maxSortOrderItem ? maxSortOrderItem.sortOrder + 1 : 0

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        vendorId: vendor.id,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        nameRw: validatedData.nameRw,
        description: validatedData.description,
        descriptionRw: validatedData.descriptionRw,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        isAvailable: validatedData.isAvailable,
        sortOrder,
      },
      include: { category: true }
    })

    return NextResponse.json({ menuItem }, { status: 201 })
  } catch (error: any) {
    console.error('Create menu item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}