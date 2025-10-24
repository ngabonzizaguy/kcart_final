import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validations'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
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

    const categoryId = params.categoryId

    // Check if category exists and belongs to vendor
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.vendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: validatedData.name,
        nameRw: validatedData.nameRw,
        description: validatedData.description,
        descriptionRw: validatedData.descriptionRw,
      },
      include: {
        _count: { select: { menuItems: true } }
      }
    })

    return NextResponse.json({ category: updatedCategory })
  } catch (error: any) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
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

    const categoryId = params.categoryId

    // Check if category exists and belongs to vendor
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.vendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if category has menu items
    const itemCount = await prisma.menuItem.count({
      where: { categoryId }
    })

    if (itemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing menu items. Please delete or move the items first.' },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}