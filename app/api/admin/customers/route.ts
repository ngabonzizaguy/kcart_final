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
    const filter = searchParams.get('filter') || 'all';
    const sort = searchParams.get('sort') || 'spend_desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by customer type
    const now = new Date();
    if (filter === 'high_value') {
      where.totalSpend = { gte: 100000 }; // > 100k RWF
    } else if (filter === 'recent') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.lastOrderAt = { gte: sevenDaysAgo };
    } else if (filter === 'inactive') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.lastOrderAt = { lt: thirtyDaysAgo };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case 'spend_desc':
        orderBy = { totalSpend: 'desc' };
        break;
      case 'spend_asc':
        orderBy = { totalSpend: 'asc' };
        break;
      case 'orders_desc':
        orderBy = { totalOrders: 'desc' };
        break;
      case 'orders_asc':
        orderBy = { totalOrders: 'asc' };
        break;
      case 'recent':
        orderBy = { lastOrderAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { lastOrderAt: 'asc' };
        break;
      default:
        orderBy = { totalSpend: 'desc' };
    }

    // Fetch customers with favorite vendor
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          orders: {
            select: {
              vendor: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Get favorite vendor name for each customer
    const formattedCustomers = customers.map((customer) => {
      // Find favorite vendor by counting orders per vendor
      const vendorCounts = new Map<string, number>();
      customer.orders.forEach((order) => {
        const vendorName = order.vendor.businessName;
        vendorCounts.set(vendorName, (vendorCounts.get(vendorName) || 0) + 1);
      });

      // Get vendor with most orders
      let favoriteVendorName = null;
      let maxCount = 0;
      vendorCounts.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteVendorName = name;
        }
      });

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalOrders: customer.totalOrders,
        totalSpend: customer.totalSpend,
        averageOrderValue: customer.averageOrderValue,
        lastOrderAt: customer.lastOrderAt?.toISOString() || null,
        firstOrderAt: customer.firstOrderAt.toISOString(),
        favoriteVendorName,
      };
    });

    return NextResponse.json({
      customers: formattedCustomers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}