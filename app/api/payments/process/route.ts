import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { processPayment } from '@/lib/payments/mobileMoney'
import { createEscrowTransaction } from '@/lib/payments/escrow'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount, paymentMethod, customerPhone, customerEmail, customerName } = body

    // Validate required fields
    if (!orderId || !amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amount, paymentMethod' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['cash_on_delivery', 'mtn_mobile_money', 'airtel_mobile_money']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if payment is already processed
    if (order.transactionId) {
      const existingTransaction = await prisma.transaction.findUnique({
        where: { id: order.transactionId },
      })

      if (existingTransaction) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment already processed for this order',
            transactionId: existingTransaction.transactionId,
            status: existingTransaction.paymentStatus
          },
          { status: 409 }
        )
      }
    }

    // Get platform settings for routing
    const platformSettings = await prisma.platformSettings.findFirst()
    const paymentNumber = platformSettings?.platformPaymentNumber

    if (!paymentNumber) {
      console.error('Platform payment number not configured')
      return NextResponse.json(
        { success: false, error: 'Payment system not properly configured' },
        { status: 503 }
      )
    }

    let transactionResult: any

    if (paymentMethod === 'cash_on_delivery') {
      // For COD, create escrow transaction directly
      await createEscrowTransaction(orderId)

      transactionResult = {
        transactionId: `COD-${order.orderNumber}-${Date.now()}`,
        status: 'success',
        message: 'Cash on delivery order created successfully'
      }
    } else {
      // For mobile money, process payment
      const provider = paymentMethod === 'mtn_mobile_money' ? 'mtn' : 'airtel'

      try {
        transactionResult = await processPayment(
          orderId,
          amount,
          provider,
          customerPhone
        )
      } catch (error: any) {
        console.error('Payment processing error:', error)
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'Payment processing failed'
          },
          { status: 502 }
        )
      }
    }

    // Create admin log entry for payment attempt
    await prisma.adminLog.create({
      data: {
        action: 'payment_processed',
        targetType: 'order',
        targetId: orderId,
        details: {
          paymentMethod,
          amount,
          transactionId: transactionResult.transactionId,
          status: transactionResult.status,
          customerPhone,
          customerEmail,
          customerName,
          platformPaymentNumber: paymentNumber,
        },
      },
    }).catch(() => {
      // Silently fail if logging doesn't work
    })

    // Return success response
    return NextResponse.json({
      success: true,
      transactionId: transactionResult.transactionId,
      status: transactionResult.status,
      message: transactionResult.message || 'Payment processed successfully',
    })

  } catch (error: any) {
    console.error('Payment processing error:', error)

    // Create admin log for error
    try {
      await prisma.adminLog.create({
        data: {
          action: 'payment_processing_failed',
          targetType: 'system',
          targetId: 'payment_api',
          details: {
            error: error.message,
            stack: error.stack,
            body: await request.clone().json().catch(() => ({})),
          },
        },
      })
    } catch {
      // Silently fail if logging doesn't work
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during payment processing'
      },
      { status: 500 }
    )
  }
}