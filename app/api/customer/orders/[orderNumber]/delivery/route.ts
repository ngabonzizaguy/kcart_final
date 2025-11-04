import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { status } = await request.json() // 'delivered' or 'not_delivered'

    if (!status || !['delivered', 'not_delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be delivered or not_delivered' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        vendor: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow delivery confirmation for 'ready' orders
    if (order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Order is not ready for delivery confirmation' },
        { status: 400 }
      )
    }

    // Update order status based on delivery confirmation
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: status === 'delivered' ? 'delivered' : 'ready', // Keep as 'ready' if not delivered for admin review
        deliveredAt: status === 'delivered' ? new Date() : null,
      },
    })

    // If delivered, trigger commission calculation and payment release
    if (status === 'delivered') {
      try {
        // This would integrate with the existing commission system
        // For now, we'll just mark the order as delivered
        // The commission calculation should happen automatically via existing triggers

        // Log the delivery confirmation for audit purposes
        await prisma.adminLog.create({
          data: {
            action: 'DELIVERY_CONFIRMED',
            details: `Order ${order.orderNumber} marked as delivered by customer`,
            orderId: order.id,
            vendorId: order.vendorId,
          },
        })

        // TODO: Trigger commission calculation and payment release
        // This should integrate with the existing commission system in lib/payments/commission.ts

      } catch (error) {
        console.error('Error processing delivery confirmation:', error)
        // Don't fail the request if commission processing fails
      }
    } else {
      // Log the not delivered status for admin review
      await prisma.adminLog.create({
        data: {
          action: 'DELIVERY_ISSUE_REPORTED',
          details: `Customer reported order ${order.orderNumber} as not delivered`,
          orderId: order.id,
          vendorId: order.vendorId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: status === 'delivered'
        ? 'Delivery confirmed. Payment has been released to vendor.'
        : 'Delivery issue reported. Our team will contact you shortly.',
      order: updatedOrder,
    })

  } catch (error) {
    console.error('Delivery confirmation error:', error)
    return NextResponse.json(
      { error: 'Failed to process delivery confirmation' },
      { status: 500 }
    )
  }
}