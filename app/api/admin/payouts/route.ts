import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // If status is pending, return eligible vendors instead of payouts
    if (status === 'pending') {
      // Get platform settings for minimum payout amount
      const platformSettings = await prisma.platformSettings.findFirst();
      const minimumAmount = platformSettings?.minimumPayoutAmount || 10000;

      // Find eligible vendors
      const eligibleVendors = await prisma.vendor.findMany({
        where: {
          payoutBalance: { gte: minimumAmount },
          isSuspended: false,
        },
        orderBy: { payoutBalance: 'desc' },
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          payoutBalance: true,
          totalOrders: true,
          lastPayoutAt: true,
        },
      });

      return NextResponse.json({
        eligibleVendors,
        payouts: [],
        total: eligibleVendors.length,
      });
    }

    // Fetch payouts for other statuses
    const where: any = { status };

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              businessName: true,
              logoUrl: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    // Format response
    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      vendorId: payout.vendorId,
      vendorName: payout.vendor.businessName,
      vendorLogo: payout.vendor.logoUrl,
      amount: payout.amount,
      status: payout.status,
      batchId: payout.batchId,
      transactionCount: payout.transactionIds.length,
      createdAt: payout.createdAt.toISOString(),
      processedAt: payout.processedAt?.toISOString() || null,
      completedAt: payout.completedAt?.toISOString() || null,
      failureReason: payout.failureReason,
    }));

    return NextResponse.json({
      payouts: formattedPayouts,
      eligibleVendors: [],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}