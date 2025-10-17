import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { menuItemSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = params.itemId

    // Check if menu item exists and belongs to vendor
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { category: true }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    if (item.vendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate with Zod schema (partial validation for updates)
    const validation = menuItemSchema.partial().safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // If categoryId is being changed, verify new category belongs to vendor
    if (validatedData.categoryId && validatedData.categoryId !== item.categoryId) {
      const newCategory = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })

      if (!newCategory || newCategory.vendorId !== vendor.id) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Update menu item
    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: validatedData,
      include: { category: true }
    })

    return NextResponse.json({ menuItem: updatedItem })
  } catch (error: any) {
    console.error('Update menu item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
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

    const itemId = params.itemId

    // Check if menu item exists and belongs to vendor
    const item = await prisma.menuItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    if (item.vendorId !== vendor.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete menu item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}