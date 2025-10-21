import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
        menuItems: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            menuItems: true,
            categories: true,
          },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ vendor })
  } catch (error: any) {
    console.error('Get vendor profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
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

    // Validate new fields if present
    if (body.address !== undefined && body.address !== null) {
      if (typeof body.address !== 'string' || body.address.length > 200) {
        return NextResponse.json(
          { error: 'Address must be a string with max 200 characters' },
          { status: 400 }
        )
      }
    }

    if (body.deliveryRange !== undefined) {
      const range = Number(body.deliveryRange)
      if (isNaN(range) || range < 2 || range > 20) {
        return NextResponse.json(
          { error: 'Delivery range must be between 2 and 20 km' },
          { status: 400 }
        )
      }
    }

    if (body.logoUrl !== undefined && body.logoUrl !== null) {
      if (typeof body.logoUrl !== 'string') {
        return NextResponse.json(
          { error: 'Logo URL must be a valid string or null' },
          { status: 400 }
        )
      }
    }

    if (body.coverUrl !== undefined && body.coverUrl !== null) {
      if (typeof body.coverUrl !== 'string') {
        return NextResponse.json(
          { error: 'Cover URL must be a valid string or null' },
          { status: 400 }
        )
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: body,
    })

    return NextResponse.json({ vendor: updatedVendor })
  } catch (error: any) {
    console.error('Update vendor profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}