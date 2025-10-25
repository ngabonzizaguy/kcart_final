import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'week';

    // Calculate date range based on period
    const now = new Date();
    const timezone = 'Africa/Kigali';
    let dateFrom: Date;
    let prevDateFrom: Date;
    let prevDateTo: Date;

    switch (period) {
      case 'today':
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
        prevDateFrom = new Date(dateFrom);
        prevDateFrom.setDate(prevDateFrom.getDate() - 1);
        prevDateTo = new Date(dateFrom);
        break;
      case 'week':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 7);
        prevDateFrom = new Date(dateFrom);
        prevDateFrom.setDate(prevDateFrom.getDate() - 7);
        prevDateTo = new Date(dateFrom);
        break;
      case 'month':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
        prevDateFrom = new Date(dateFrom);
        prevDateFrom.setDate(prevDateFrom.getDate() - 30);
        prevDateTo = new Date(dateFrom);
        break;
      case 'all':
      default:
        dateFrom = new Date(0); // Beginning of time
        prevDateFrom = new Date(0);
        prevDateTo = new Date(0);
        break;
    }

    // Fetch current period data
    const [
      totalVendors,
      totalCustomers,
      totalOrders,
      currentOrders,
      recentOrders,
      pendingPayouts,
    ] = await Promise.all([
      // Total vendors
      prisma.vendor.count(),

      // Total customers
      prisma.customer.count(),

      // Total orders
      prisma.order.count(),

      // Orders in current period
      prisma.order.findMany({
        where: {
          createdAt: { gte: dateFrom },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      }),

      // Recent 10 orders for display
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      }),

      // Pending payouts
      prisma.vendor.aggregate({
        _sum: {
          payoutBalance: true,
        },
        where: {
          payoutBalance: { gt: 0 },
          isSuspended: false,
        },
      }),
    ]);

    // Calculate GMV and commission for current period
    const currentGMV = currentOrders.reduce((sum, order) => sum + order.total, 0);
    const currentCommission = currentOrders.reduce(
      (sum, order) => sum + (order.commissionAmount || 0),
      0
    );

    // Fetch previous period data for comparison
    let prevOrders: typeof currentOrders = [];
    if (period !== 'all') {
      prevOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: prevDateFrom,
            lt: prevDateTo,
          },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      });
    }

    const prevGMV = prevOrders.reduce((sum, order) => sum + order.total, 0);
    const prevCommission = prevOrders.reduce(
      (sum, order) => sum + (order.commissionAmount || 0),
      0
    );

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Count eligible vendors for payouts
    const eligibleVendorsCount = await prisma.vendor.count({
      where: {
        payoutBalance: { gt: 0 },
        isSuspended: false,
      },
    });

    // Format response
    const response = {
      kpis: {
        totalVendors,
        totalCustomers,
        totalOrders,
        gmv: currentGMV,
        platformCommission: currentCommission,
        pendingPayouts: pendingPayouts._sum.payoutBalance || 0,
        changes: {
          vendors: 0, // Would need historical data
          customers: 0, // Would need historical data
          orders: calculateChange(currentOrders.length, prevOrders.length),
          gmv: calculateChange(currentGMV, prevGMV),
          commission: calculateChange(currentCommission, prevCommission),
        },
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        vendorName: order.vendor.businessName,
        customerName: order.customerName,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod || 'cash_on_delivery',
        createdAt: order.createdAt.toISOString(),
      })),
      pendingPayoutsCount: eligibleVendorsCount,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}