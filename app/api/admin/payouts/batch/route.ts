import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

/**
 * Simulate payout processing
 * In production, this would integrate with actual payment provider
 */
async function simulatePayoutProcessing(payoutId: string): Promise<boolean> {
  // Simulate processing delay (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 5% random failure rate
  const failureRate = 0.05;
  const failed = Math.random() < failureRate;

  return !failed; // Returns true if successful
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { vendorIds } = body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid vendor IDs' },
        { status: 400 }
      );
    }

    // Generate batch ID
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const batchCounter = await prisma.payout.count({
      where: {
        batchId: { startsWith: `BATCH-${dateStr}` },
      },
    });
    const batchId = `BATCH-${dateStr}-${String(batchCounter + 1).padStart(3, '0')}`;

    // Fetch vendors
    const vendors = await prisma.vendor.findMany({
      where: {
        id: { in: vendorIds },
        isSuspended: false,
      },
      include: {
        transactions: {
          where: {
            paymentStatus: 'success',
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (vendors.length === 0) {
      return NextResponse.json(
        { error: 'No eligible vendors found' },
        { status: 400 }
      );
    }

    const payouts = [];
    const results = {
      successful: 0,
      failed: 0,
      totalAmount: 0,
    };

    // Create payout records for each vendor
    for (const vendor of vendors) {
      if (vendor.payoutBalance <= 0) continue;

      // Get recent transaction IDs (last 50)
      const recentTransactionIds = vendor.transactions
        .slice(0, 50)
        .map((t) => t.id);

      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          vendorId: vendor.id,
          amount: vendor.payoutBalance,
          status: 'processing',
          batchId,
          transactionIds: recentTransactionIds,
          paymentMethod: 'bank_transfer',
          processedAt: now,
        },
      });

      payouts.push(payout);

      // Simulate processing
      const success = await simulatePayoutProcessing(payout.id);

      if (success) {
        // Update payout as completed
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // Deduct from vendor balance
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: {
            payoutBalance: 0,
            lastPayoutAt: new Date(),
          },
        });

        results.successful++;
        results.totalAmount += payout.amount;
      } else {
        // Mark as failed
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
            failureReason: 'Simulated payment failure',
          },
        });

        results.failed++;
      }
    }

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'payout_batch_processed',
        targetType: 'payout',
        targetId: batchId,
        details: {
          vendorCount: vendors.length,
          batchId,
          ...results,
        },
      },
    });

    return NextResponse.json({
      success: true,
      batchId,
      payouts: payouts.map((p) => p.id),
      results,
    });
  } catch (error: any) {
    console.error('Error processing batch payout:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to process batch payout' },
      { status: 500 }
    );
  }
}