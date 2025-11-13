import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleMomoWebhook } from '@/lib/payments/mtnMomo';

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload from MTN
    const body = await request.json();

    console.log('MTN MoMo webhook received:', {
      timestamp: new Date().toISOString(),
      body,
    });

    // Process the webhook
    const webhookResult = await handleMomoWebhook(body);

    // Find the transaction in our database
    const transaction = await prisma.transaction.findFirst({
      where: {
        transactionId: webhookResult.transactionId,
        paymentMethod: 'mtn_mobile_money',
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      console.log('Transaction not found for webhook:', webhookResult.transactionId);
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if status has changed (avoid duplicate processing)
    if (transaction.paymentStatus === webhookResult.status.toLowerCase()) {
      console.log('Transaction status unchanged, skipping update');
      return NextResponse.json({ success: true });
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: webhookResult.status.toLowerCase(),
        completedAt: webhookResult.status === 'SUCCESSFUL' ? new Date() : null,
        metadata: {
          ...(transaction.metadata as any || {}),
          webhookStatus: webhookResult.status,
          webhookMessage: webhookResult.message,
          webhookProcessedAt: new Date(),
        },
      },
    });

    // Update order status if payment was successful
    if (webhookResult.status === 'SUCCESSFUL' && transaction.order) {
      await prisma.order.update({
        where: { id: transaction.order.id },
        data: {
          paymentStatus: 'paid',
        },
      });

      console.log('Payment completed via webhook for order:', transaction.order.orderNumber);
    }

    // Create admin log for webhook processing
    await prisma.adminLog.create({
      data: {
        action: 'mtn_webhook_processed',
        targetType: 'transaction',
        targetId: transaction.id,
        details: {
          transactionId: webhookResult.transactionId,
          oldStatus: transaction.paymentStatus,
          newStatus: webhookResult.status,
          orderId: transaction.orderId,
          message: webhookResult.message,
        },
      },
    });

    console.log('MTN MoMo webhook processed successfully:', {
      transactionId: webhookResult.transactionId,
      status: webhookResult.status,
      orderId: transaction.orderId,
    });

    // Return success response to MTN
    return NextResponse.json({
      success: true,
      transactionId: webhookResult.transactionId,
      status: webhookResult.status,
    });

  } catch (error: any) {
    console.error('Error processing MTN MoMo webhook:', error);

    // Create error log
    try {
      await prisma.adminLog.create({
        data: {
          action: 'mtn_webhook_error',
          targetType: 'system',
          targetId: 'mtn_webhook',
          details: {
            error: error.message,
            stack: error.stack,
            body: await request.clone().json().catch(() => ({})),
          },
        },
      });
    } catch {
      // Silently fail if logging doesn't work
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing webhook connectivity
 */
export async function GET() {
  try {
    const environmentInfo = await import('@/lib/payments/mtnMomo').then(m => m.getMomoEnvironmentInfo());

    return NextResponse.json({
      success: true,
      message: 'MTN MoMo webhook endpoint is active',
      environment: environmentInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}