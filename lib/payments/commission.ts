// Commission Calculation System
// Automatically calculates platform commission when orders are completed

import prisma from '@/lib/prisma';

/**
 * Get applicable commission rate for a vendor
 * Checks vendor-specific override first, falls back to global rate
 */
export async function getCommissionRate(vendorId: string): Promise<number> {
  // Try vendor-specific rate first
  const vendorSetting = await prisma.commissionSettings.findFirst({
    where: {
      vendorId,
      isActive: true,
    },
  });

  if (vendorSetting) {
    return vendorSetting.commissionPercentage;
  }

  // Fall back to global rate
  const globalSetting = await prisma.commissionSettings.findFirst({
    where: {
      vendorId: null,
      isActive: true,
    },
  });

  if (globalSetting) {
    return globalSetting.commissionPercentage;
  }

  // If no settings exist, check platform settings
  const platformSettings = await prisma.platformSettings.findFirst();
  if (platformSettings) {
    return platformSettings.globalCommissionPercentage;
  }

  // Ultimate fallback: 15%
  console.warn('No commission settings found, using default 15%');
  return 15.0;
}

/**
 * Calculate and create commission transaction for a completed order
 * This should be called when order status changes to "completed"
 */
export async function calculateCommission(orderId: string): Promise<void> {
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

    // Check if order is completed
    if (order.status !== 'completed') {
      console.log(`Order ${orderId} is not completed yet, skipping commission calculation`);
      return;
    }

    // Check if transaction already exists
    if (order.transaction) {
      console.log(`Transaction already exists for order ${orderId}, skipping`);
      return;
    }

    // Check if order already has commission calculated
    if (order.commissionAmount !== null) {
      console.log(`Commission already calculated for order ${orderId}, skipping`);
      return;
    }

    // Get commission rate
    const commissionRate = await getCommissionRate(order.vendorId);

    // Calculate amounts
    const platformCommission = (order.total * commissionRate) / 100;
    const vendorAmount = order.total - platformCommission;

    // Determine payment status based on payment method
    let paymentStatus: 'pending' | 'success' | 'failed' = 'pending';
    if (order.paymentMethod === 'cash_on_delivery') {
      // COD is always considered successful
      paymentStatus = 'success';
    } else {
      // For mobile money, check if payment was successful
      // This would typically be set by the payment webhook
      paymentStatus = 'success'; // Default to success for completed orders
    }

    // Get platform settings for payment routing
    const platformSettings = await prisma.platformSettings.findFirst();

    // Generate transaction ID
    const transactionId = `TXN-${order.orderNumber}-${Date.now()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        orderId: order.id,
        vendorId: order.vendorId,
        transactionId,
        paymentMethod: order.paymentMethod || 'cash_on_delivery',
        paymentStatus,
        amount: order.total,
        platformCommission,
        vendorAmount,
        isMock: process.env.PAYMENTS_LIVE !== 'true',
        completedAt: new Date(),
        metadata: {
          platformPaymentNumber: platformSettings?.platformPaymentNumber || null,
          escrowStatus: 'HELD',
          releasedAt: new Date(), // For completed orders, release immediately
        },
      },
    });

    // Update order with transaction details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        transactionId: transaction.id,
        commissionAmount: platformCommission,
        vendorAmount,
      },
    });

    // Update vendor aggregates (atomic updates)
    await prisma.vendor.update({
      where: { id: order.vendorId },
      data: {
        payoutBalance: { increment: vendorAmount },
        totalEarnings: { increment: vendorAmount },
        totalOrders: { increment: 1 },
      },
    });

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'commission_calculated',
        targetType: 'order',
        targetId: orderId,
        details: {
          platformCommission,
          vendorAmount,
          commissionRate,
          orderTotal: order.total,
          vendorId: order.vendorId,
        },
      },
    });

    console.log(`Commission calculated for order ${orderId}:`, {
      platformCommission,
      vendorAmount,
      commissionRate,
    });
  } catch (error: any) {
    console.error(`Error calculating commission for order ${orderId}:`, error);

    // Create error log
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'commission_calculation_failed',
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
 * Reverse commission for a cancelled order
 * Use this when an order is cancelled after commission was calculated
 */
export async function reverseCommission(orderId: string, reason?: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transaction: true },
    });

    if (!order || !order.transaction) {
      console.log(`No transaction found for order ${orderId}, nothing to reverse`);
      return;
    }

    const transaction = order.transaction;

    // Create reversal transaction
    const reversalTxnId = `REV-${transaction.transactionId}-${Date.now()}`;
    await prisma.transaction.create({
      data: {
        orderId: `${orderId}-REVERSAL`,
        vendorId: order.vendorId,
        transactionId: reversalTxnId,
        paymentMethod: transaction.paymentMethod,
        paymentStatus: 'success',
        amount: -transaction.amount,
        platformCommission: -transaction.platformCommission,
        vendorAmount: -transaction.vendorAmount,
        isMock: transaction.isMock,
        metadata: {
          reversalReason: reason || 'Order cancelled',
          originalTransactionId: transaction.transactionId,
        },
        completedAt: new Date(),
      },
    });

    // Update vendor balances (deduct)
    await prisma.vendor.update({
      where: { id: order.vendorId },
      data: {
        payoutBalance: { decrement: transaction.vendorAmount },
        totalEarnings: { decrement: transaction.vendorAmount },
        totalOrders: { decrement: 1 },
      },
    });

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: 'SYSTEM',
        action: 'commission_reversed',
        targetType: 'order',
        targetId: orderId,
        details: {
          reason: reason || 'Order cancelled',
          reversedAmount: transaction.vendorAmount,
          platformCommission: transaction.platformCommission,
        },
      },
    });

    console.log(`Commission reversed for order ${orderId}`);
  } catch (error: any) {
    console.error(`Error reversing commission for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Batch calculate commissions for multiple completed orders
 * Useful for backfilling or migration
 */
export async function batchCalculateCommissions(orderIds: string[]): Promise<{
  successful: string[];
  failed: Array<{ orderId: string; error: string }>;
}> {
  const results = {
    successful: [] as string[],
    failed: [] as Array<{ orderId: string; error: string }>,
  };

  for (const orderId of orderIds) {
    try {
      await calculateCommission(orderId);
      results.successful.push(orderId);
    } catch (error: any) {
      results.failed.push({
        orderId,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get commission summary for a vendor
 */
export async function getVendorCommissionSummary(vendorId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { vendorId },
    select: {
      amount: true,
      platformCommission: true,
      vendorAmount: true,
      createdAt: true,
    },
  });

  const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalCommission = transactions.reduce((sum, txn) => sum + txn.platformCommission, 0);
  const totalVendorEarnings = transactions.reduce((sum, txn) => sum + txn.vendorAmount, 0);

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    totalCommission,
    totalVendorEarnings,
    averageCommission: transactions.length > 0 ? totalCommission / transactions.length : 0,
  };
}