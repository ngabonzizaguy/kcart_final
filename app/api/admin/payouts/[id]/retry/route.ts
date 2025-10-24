import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

/**
 * Simulate payout processing
 */
async function simulatePayoutProcessing(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const failureRate = 0.05;
  return Math.random() >= failureRate;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();

    // Get the failed payout
    const payout = await prisma.payout.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    if (payout.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed payouts can be retried' },
        { status: 400 }
      );
    }

    // Update to processing
    await prisma.payout.update({
      where: { id: params.id },
      data: {
        status: 'processing',
        processedAt: new Date(),
        failureReason: null,
      },
    });

    // Simulate processing
    const success = await simulatePayoutProcessing();

    if (success) {
      // Update as completed
      await prisma.payout.update({
        where: { id: params.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Deduct from vendor balance (if not already deducted)
      if (payout.vendor.payoutBalance >= payout.amount) {
        await prisma.vendor.update({
          where: { id: payout.vendorId },
          data: {
            payoutBalance: { decrement: payout.amount },
            lastPayoutAt: new Date(),
          },
        });
      }

      // Create admin log
      await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'payout_retried',
          targetType: 'payout',
          targetId: params.id,
          details: {
            vendorName: payout.vendor.businessName,
            amount: payout.amount,
            result: 'success',
          },
        },
      });

      return NextResponse.json({
        success: true,
        payout: { ...payout, status: 'completed' },
      });
    } else {
      // Mark as failed again
      await prisma.payout.update({
        where: { id: params.id },
        data: {
          status: 'failed',
          failureReason: 'Retry failed: Simulated payment failure',
        },
      });

      // Create admin log
      await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'payout_retry_failed',
          targetType: 'payout',
          targetId: params.id,
          details: {
            vendorName: payout.vendor.businessName,
            amount: payout.amount,
            result: 'failed',
          },
        },
      });

      return NextResponse.json({
        success: false,
        message: 'Payout retry failed',
      });
    }
  } catch (error: any) {
    console.error('Error retrying payout:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to retry payout' },
      { status: 500 }
    );
  }
}