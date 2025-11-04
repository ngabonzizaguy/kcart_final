// Escrow Payment Management System
// Handles payment holding and release based on delivery confirmation

import prisma from '@/lib/prisma';
import { calculateCommission } from './commission';

/**
 * Create escrow transaction when order is placed
 * This holds funds until delivery confirmation
 */
export async function createEscrowTransaction(orderId: string): Promise<void> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Check if transaction already exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { orderId },
    });

    if (existingTransaction) {
      console.log(`Transaction already exists for order ${orderId}, skipping escrow creation`);
      return;
    }

    // Get platform settings for payment routing
    const platformSettings = await prisma.platformSettings.findFirst();

    // Get commission rate
    const commissionRate = await prisma.commissionSettings.findFirst({
      where: { vendorId: null, isActive: true },
    });

    const commissionPercentage = commissionRate?.commissionPercentage ||
                               platformSettings?.globalCommissionPercentage || 15.0;

    // Calculate amounts
    const platformCommission = (order.total * commissionPercentage) / 100;
    const vendorAmount = order.total - platformCommission;

    // Generate transaction ID
    const transactionId = `ESCROW-${order.orderNumber}-${Date.now()}`;

    // Create escrow transaction record
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        vendorId: order.vendorId,
        transactionId,
        paymentMethod: order.paymentMethod || 'cash_on_delivery',
        paymentStatus: 'success', // Payment received from customer
        amount: order.total,
        platformCommission,
        vendorAmount,
        isMock: process.env.PAYMENTS_LIVE !== 'true',
        completedAt: new Date(),
        metadata: {
          platformPaymentNumber: platformSettings?.platformPaymentNumber || null,
          escrowStatus: 'HELD',
          heldAt: new Date(),
          paymentRouting: 'PLATFORM_WALLET',
        },
      },
    });

    // Update order with transaction details (but don't release commission yet)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId: transaction.id,
        commissionAmount: platformCommission,
        vendorAmount,
      },
    });

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        adminId: null, // System action
        action: 'escrow_created',
        targetType: 'order',
        targetId: orderId,
        details: {
          platformCommission,
          vendorAmount,
          commissionPercentage,
          orderTotal: order.total,
          vendorId: order.vendorId,
          platformPaymentNumber: platformSettings?.platformPaymentNumber,
        },
      },
    });

    console.log(`Escrow transaction created for order ${orderId}:`, {
      platformCommission,
      vendorAmount,
      commissionPercentage,
      platformPaymentNumber: platformSettings?.platformPaymentNumber,
    });

  } catch (error: any) {
    console.error(`Error creating escrow transaction for order ${orderId}:`, error);

    // Create error log
    await prisma.adminLog.create({
      data: {
        adminId: null, // System action
        action: 'escrow_creation_failed',
        targetType: 'order',
        targetId: orderId,
        details: {
          error: error.message,
          stack: error.stack,
        },
      },
    }).catch(() => {
      // Silently fail if logging fails
    });

    throw error;
  }
}

/**
 * Release funds from escrow when delivery is confirmed
 * This updates vendor balances and finalizes the transaction
 */
export async function releaseEscrowFunds(orderId: string): Promise<void> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        transaction: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (!order.transaction) {
      throw new Error(`No transaction found for order ${orderId}`);
    }

    const transaction = order.transaction;

    // Check if funds are already released
    const currentMetadata = transaction.metadata as any || {};
    if (currentMetadata.escrowStatus === 'RELEASED') {
      console.log(`Funds already released for order ${orderId}, skipping`);
      return;
    }

    // Update transaction metadata to release funds
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          ...currentMetadata,
          escrowStatus: 'RELEASED',
          releasedAt: new Date(),
        },
      },
    });

    // Update vendor aggregates (only release funds when delivered)
    await prisma.vendor.update({
      where: { id: order.vendorId },
      data: {
        payoutBalance: { increment: transaction.vendorAmount },
        totalEarnings: { increment: transaction.vendorAmount },
        totalOrders: { increment: 1 },
      },
    });

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'escrow_released',
        targetType: 'order',
        targetId: orderId,
        details: {
          releasedAmount: transaction.vendorAmount,
          platformCommission: transaction.platformCommission,
          orderTotal: order.total,
          vendorId: order.vendorId,
        },
      },
    });

    console.log(`Escrow funds released for order ${orderId}:`, {
      releasedAmount: transaction.vendorAmount,
      platformCommission: transaction.platformCommission,
    });

  } catch (error: any) {
    console.error(`Error releasing escrow funds for order ${orderId}:`, error);

    // Create error log
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'escrow_release_failed',
        targetType: 'order',
        targetId: orderId,
        details: {
          error: error.message,
          stack: error.stack,
        },
      },
    }).catch(() => {
      // Silently fail if logging fails
    });

    throw error;
  }
}

/**
 * Handle escrow for delivery issues
 * Flags the transaction for admin review
 */
export async function handleDeliveryIssue(orderId: string, issueReason?: string): Promise<void> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        transaction: true,
      },
    });

    if (!order || !order.transaction) {
      console.log(`No transaction found for order ${orderId}, cannot handle delivery issue`);
      return;
    }

    const transaction = order.transaction;

    // Update transaction metadata to flag for review
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        metadata: {
          ...(transaction.metadata as any || {}),
          escrowStatus: 'DELIVERY_ISSUE',
          issueReportedAt: new Date(),
          issueReason,
        },
      },
    });

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'delivery_issue_reported',
        targetType: 'order',
        targetId: orderId,
        details: {
          issueReason,
          orderTotal: order.total,
          vendorId: order.vendorId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        },
      },
    });

    console.log(`Delivery issue reported for order ${orderId}:`, { issueReason });

  } catch (error: any) {
    console.error(`Error handling delivery issue for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get escrow summary for admin dashboard
 */
export async function getEscrowSummary() {
  const heldTransactions = await prisma.transaction.count({
    where: {
      metadata: {
        path: ['escrowStatus'],
        equals: 'HELD',
      },
    },
  });

  const releasedTransactions = await prisma.transaction.count({
    where: {
      metadata: {
        path: ['escrowStatus'],
        equals: 'RELEASED',
      },
    },
  });

  const issueTransactions = await prisma.transaction.count({
    where: {
      metadata: {
        path: ['escrowStatus'],
        equals: 'DELIVERY_ISSUE',
      },
    },
  });

  const totalHeldAmount = await prisma.transaction.aggregate({
    where: {
      metadata: {
        path: ['escrowStatus'],
        equals: 'HELD',
      },
    },
    _sum: {
      amount: true,
    },
  });

  return {
    heldCount: heldTransactions,
    releasedCount: releasedTransactions,
    issueCount: issueTransactions,
    totalHeldAmount: totalHeldAmount._sum.amount || 0,
  };
}