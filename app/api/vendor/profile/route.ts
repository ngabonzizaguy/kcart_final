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
