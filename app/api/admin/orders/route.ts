import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const paymentMethod = searchParams.get('paymentMethod') || 'all';
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { vendor: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Payment method filter
    if (paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }

    // Payment status filter
    if (paymentStatus !== 'all') {
      where.transaction = {
        paymentStatus,
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Fetch orders
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
          transaction: {
            select: {
              paymentStatus: true,
              platformCommission: true,
              vendorAmount: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    // Format response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      vendorName: order.vendor.businessName,
      vendorLogo: order.vendor.logoUrl,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod || 'cash_on_delivery',
      paymentStatus: order.transaction?.paymentStatus || null,
      commissionAmount: order.commissionAmount,
      vendorAmount: order.vendorAmount,
      createdAt: order.createdAt.toISOString(),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}