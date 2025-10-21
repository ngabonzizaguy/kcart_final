import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for order creation
const createOrderSchema = z.object({
  vendorId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  deliveryType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'mtn_mobile_money', 'airtel_mobile_money']).optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().uuid(),
      name: z.string(),
      nameRw: z.string().nullable().optional(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
      subtotal: z.number().positive(),
    })
  ).min(1),
  subtotal: z.number().positive(),
  deliveryFee: z.number().min(0),
  total: z.number().positive(),
})

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')

  return `DEL-${year}${month}${day}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = createOrderSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        // ✅ FIXED: Changed .errors to .issues
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verify vendor exists and is online
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.vendorId },
      select: { id: true, isOnline: true, slug: true },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 400 }
      )
    }

    if (!vendor.isOnline) {
      return NextResponse.json(
        { error: 'Restaurant is currently offline and not accepting orders' },
        { status: 400 }
      )
    }

    // Verify menu items exist and are available
    const menuItemIds = data.items.map((item) => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        vendorId: data.vendorId,
      },
      select: { id: true, name: true, isAvailable: true },
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'Some menu items not found' },
        { status: 400 }
      )
    }

    const unavailableItems = menuItems.filter((item) => !item.isAvailable)
    if (unavailableItems.length > 0) {
      const itemNames = unavailableItems.map((item) => item.name).join(', ')
      return NextResponse.json(
        { error: `Some items are no longer available: ${itemNames}` },
        { status: 400 }
      )
    }

    // Verify calculations
    const calculatedSubtotal = data.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    )
    const calculatedTotal = calculatedSubtotal + data.deliveryFee

    if (
      Math.abs(calculatedSubtotal - data.subtotal) > 0.01 ||
      Math.abs(calculatedTotal - data.total) > 0.01
    ) {
      return NextResponse.json(
        { error: 'Order total calculation error' },
        { status: 400 }
      )
    }

    // Verify deliveryAddress is present if deliveryType is delivery
    if (data.deliveryType === 'delivery' && !data.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    // Generate order number
    let orderNumber = generateOrderNumber()
    let orderNumberExists = await prisma.order.findUnique({
      where: { orderNumber },
    })

    // If order number already exists, generate a new one (rare collision)
    while (orderNumberExists) {
      orderNumber = generateOrderNumber()
      orderNumberExists = await prisma.order.findUnique({
        where: { orderNumber },
      })
    }

    // Create order with items in a transaction
    const order = await prisma.order.create({
      data: {
        orderNumber,
        vendorId: data.vendorId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || null,
        deliveryType: data.deliveryType,
        deliveryAddress: data.deliveryAddress || null,
        deliveryNotes: data.deliveryNotes || null,
        paymentMethod: data.paymentMethod || null,
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        total: data.total,
        status: 'new',
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            nameRw: item.nameRw || null,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: true,
        vendor: {
          select: {
            id: true,
            slug: true,
            businessName: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          vendorId: order.vendorId,
          vendorSlug: order.vendor.slug,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}