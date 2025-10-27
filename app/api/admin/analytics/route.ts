import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

type Granularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

function getDateBuckets(dateFrom: Date, dateTo: Date, granularity: Granularity): Date[] {
  const buckets: Date[] = [];
  const current = new Date(dateFrom);

  while (current <= dateTo) {
    buckets.push(new Date(current));

    switch (granularity) {
      case 'hourly':
        current.setHours(current.getHours() + 1);
        break;
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return buckets;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const dateRangeParam = searchParams.get('dateRange') || '30';
    const daysBack = parseInt(dateRangeParam);
    const dateFrom = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const dateTo = new Date();
    const granularity = (searchParams.get('granularity') || 'day') as 'day' | 'week' | 'month';

    console.log('Analytics request:', { dateFrom, dateTo, granularity, daysBack });

    // Fetch all orders in date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Generate date buckets
    const dateBuckets = getDateBuckets(dateFrom, dateTo, granularity);

    // Initialize revenue data
    const revenueData = {
      gmv: dateBuckets.map(date => ({ date: date.toISOString(), value: 0 })),
      commission: dateBuckets.map(date => ({ date: date.toISOString(), value: 0 })),
      vendorEarnings: dateBuckets.map(date => ({ date: date.toISOString(), value: 0 })),
    };

    // Initialize orders by status data
    const ordersData = {
      byStatus: dateBuckets.map(date => ({
        date: date.toISOString(),
        completed: 0,
        preparing: 0,
        cancelled: 0,
        new: 0,
      })),
    };

    // Process orders
    const vendorRevenue = new Map<string, { name: string; revenue: number }>();
    const paymentMethods = { cod: 0, mtn: 0, airtel: 0 };

    orders.forEach(order => {
      // Find bucket index
      const orderDate = new Date(order.createdAt);
      let bucketIndex = 0;

      for (let i = 0; i < dateBuckets.length - 1; i++) {
        if (orderDate >= dateBuckets[i] && orderDate < dateBuckets[i + 1]) {
          bucketIndex = i;
          break;
        }
      }
      if (orderDate >= dateBuckets[dateBuckets.length - 1]) {
        bucketIndex = dateBuckets.length - 1;
      }

      // Revenue data
      revenueData.gmv[bucketIndex].value += order.total;
      revenueData.commission[bucketIndex].value += order.commissionAmount || 0;
      revenueData.vendorEarnings[bucketIndex].value += order.vendorAmount || 0;

      // Orders by status
      const statusKey = order.status as 'completed' | 'preparing' | 'cancelled' | 'new';
      if (ordersData.byStatus[bucketIndex][statusKey] !== undefined) {
        ordersData.byStatus[bucketIndex][statusKey]++;
      }

      // Vendor revenue
      const vendorId = order.vendor.id;
      const vendorName = order.vendor.businessName;
      if (!vendorRevenue.has(vendorId)) {
        vendorRevenue.set(vendorId, { name: vendorName, revenue: 0 });
      }
      vendorRevenue.get(vendorId)!.revenue += order.total;

      // Payment methods
      if (order.paymentMethod === 'cash_on_delivery') {
        paymentMethods.cod++;
      } else if (order.paymentMethod === 'mtn_mobile_money') {
        paymentMethods.mtn++;
      } else if (order.paymentMethod === 'airtel_mobile_money') {
        paymentMethods.airtel++;
      }
    });

    // Top vendors
    const topVendors = Array.from(vendorRevenue.entries())
      .map(([vendorId, data]) => ({
        vendorId,
        name: data.name,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Customer insights
    const customers = await prisma.customer.findMany({
      where: {
        firstOrderAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    const allCustomers = await prisma.customer.findMany({
      select: {
        totalOrders: true,
      },
    });

    const repeatCustomers = allCustomers.filter(c => c.totalOrders > 1).length;
    const repeatRate = allCustomers.length > 0 ? (repeatCustomers / allCustomers.length) * 100 : 0;

    // Customer growth data
    const customerGrowthData = {
      new: dateBuckets.map(date => ({ date: date.toISOString(), count: 0 })),
      total: dateBuckets.map(date => ({ date: date.toISOString(), count: 0 })),
    };

    customers.forEach(customer => {
      const customerDate = new Date(customer.firstOrderAt);
      let bucketIndex = 0;

      for (let i = 0; i < dateBuckets.length - 1; i++) {
        if (customerDate >= dateBuckets[i] && customerDate < dateBuckets[i + 1]) {
          bucketIndex = i;
          break;
        }
      }

      customerGrowthData.new[bucketIndex].count++;
    });

    // Calculate cumulative total
    let cumulativeTotal = 0;
    customerGrowthData.total = customerGrowthData.new.map(item => {
      cumulativeTotal += item.count;
      return { date: item.date, count: cumulativeTotal };
    });

    // Format data to match frontend expectations
    const formattedResponse = {
      revenue: {
        timeline: dateBuckets.map((date, index) => ({
          date: date.toISOString(),
          revenue: revenueData.gmv[index].value,
          commission: revenueData.commission[index].value,
        })),
      },
      orders: {
        byStatus: ordersData.byStatus,
      },
      topVendors: topVendors.map((vendor, index) => ({
        id: vendor.vendorId,
        name: vendor.name,
        revenue: vendor.revenue,
        orders: orders.filter(o => o.vendor.id === vendor.vendorId).length,
      })),
      paymentMethods: [
        { method: 'cash_on_delivery', count: paymentMethods.cod, revenue: 0 },
        { method: 'mtn_mobile_money', count: paymentMethods.mtn, revenue: 0 },
        { method: 'airtel_mobile_money', count: paymentMethods.airtel, revenue: 0 },
      ].filter(pm => pm.count > 0),
      customerGrowth: dateBuckets.map((date, index) => ({
        date: date.toISOString(),
        newCustomers: customerGrowthData.new[index].count,
        totalCustomers: customerGrowthData.total[index].count,
      })),
    };

    return NextResponse.json(formattedResponse);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}