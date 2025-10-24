import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            businessPhone: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            totalOrders: true,
            totalSpend: true,
          },
        },
        transaction: {
          select: {
            transactionId: true,
            paymentMethod: true,
            paymentStatus: true,
            amount: true,
            platformCommission: true,
            vendorAmount: true,
            createdAt: true,
            completedAt: true,
            metadata: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          imageUrl: item.menuItem?.imageUrl || null,
        })),
      },
      vendor: order.vendor,
      customer: order.customer,
      transaction: order.transaction,
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}