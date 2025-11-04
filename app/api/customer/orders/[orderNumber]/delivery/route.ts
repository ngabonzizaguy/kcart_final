import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { releaseEscrowFunds, handleDeliveryIssue } from '@/lib/payments/escrow'

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

    // Handle delivery confirmation with escrow system
    if (status === 'delivered') {
      try {
        // Release escrow funds to vendor
        await releaseEscrowFunds(order.id)

        // Log the delivery confirmation for audit purposes
        await prisma.adminLog.create({
          data: {
            action: 'DELIVERY_CONFIRMED',
            targetType: 'order',
            targetId: order.id,
            details: {
              message: `Order ${order.orderNumber} marked as delivered by customer - escrow funds released`,
              orderNumber: order.orderNumber,
              vendorId: order.vendorId,
              vendorName: order.vendor?.businessName,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            },
          },
        })

      } catch (error) {
        console.error('Error processing delivery confirmation:', error)
        // Don't fail the request if escrow processing fails
      }
    } else {
      try {
        // Handle delivery issue with escrow system
        await handleDeliveryIssue(order.id, 'Customer reported order as not delivered')

        // Log the not delivered status for admin review
        await prisma.adminLog.create({
          data: {
            action: 'DELIVERY_ISSUE_REPORTED',
            details: `Customer reported order ${order.orderNumber} as not delivered - escrow flagged for review`,
            orderId: order.id,
            vendorId: order.vendorId,
          },
        })

      } catch (error) {
        console.error('Error processing delivery issue:', error)
        // Don't fail the request if escrow processing fails
      }
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