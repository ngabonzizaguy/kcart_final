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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessPhone: { contains: search } },
      ];
    }

    // Status filters
    if (status === 'verified') {
      where.isVerified = true;
    } else if (status === 'unverified') {
      where.isVerified = false;
    } else if (status === 'active') {
      where.isSuspended = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    } else if (status === 'high_performers') {
      where.totalOrders = { gte: 100 };
    }

    // Fetch vendors
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          commissionSettings: {
            where: { isActive: true },
            select: { commissionPercentage: true },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    // Format response
    const formattedVendors = vendors.map((vendor) => ({
      id: vendor.id,
      businessName: vendor.businessName,
      email: vendor.email,
      phone: vendor.businessPhone,
      logoUrl: vendor.logoUrl,
      isVerified: vendor.isVerified,
      isSuspended: vendor.isSuspended,
      totalOrders: vendor.totalOrders,
      payoutBalance: vendor.payoutBalance,
      commissionRate: vendor.commissionSettings[0]?.commissionPercentage || null,
      slug: vendor.slug,
    }));

    return NextResponse.json({
      vendors: formattedVendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}