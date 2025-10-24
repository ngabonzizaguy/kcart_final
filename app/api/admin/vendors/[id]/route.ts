import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        commissionSettings: {
          where: { isActive: true },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Get activity logs for this vendor
    const activityLogs = await prisma.adminLog.findMany({
      where: {
        targetType: 'vendor',
        targetId: params.id,
      },
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      vendor: {
        ...vendor,
        commissionRate: vendor.commissionSettings[0]?.commissionPercentage || null,
      },
      orders: vendor.orders,
      payouts: vendor.payouts,
      activityLogs,
    });
  } catch (error: any) {
    console.error('Error fetching vendor details:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch vendor details' },
      { status: 500 }
    );
  }
}