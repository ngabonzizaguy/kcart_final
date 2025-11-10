import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        businessName: true,
        businessNameRw: true,
        description: true,
        descriptionRw: true,
        logoUrl: true,
        coverUrl: true,
        coverUrls: true,
        address: true,
        businessPhone: true,
        acceptedPaymentMethods: true,
        isOnline: true,
        deliveryFee: true,
        cuisineTags: true,
      }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json({ vendor })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor data' },
      { status: 500 }
    )
  }
}