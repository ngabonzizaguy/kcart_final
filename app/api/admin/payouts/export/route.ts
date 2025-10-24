import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    // Fetch all payouts for export
    const payouts = await prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            businessName: true,
            businessPhone: true,
            email: true,
          },
        },
      },
    });

    // Generate CSV content
    const headers = [
      'Payout ID',
      'Vendor Name',
      'Vendor Phone',
      'Vendor Email',
      'Amount (RWF)',
      'Status',
      'Batch ID',
      'Transaction Count',
      'Created At',
      'Processed At',
      'Completed At',
      'Failure Reason',
    ];

    const rows = payouts.map((payout) => [
      payout.id,
      payout.vendor.businessName,
      payout.vendor.businessPhone,
      payout.vendor.email,
      payout.amount.toString(),
      payout.status,
      payout.batchId || '',
      payout.transactionIds.length.toString(),
      payout.createdAt.toISOString(),
      payout.processedAt?.toISOString() || '',
      payout.completedAt?.toISOString() || '',
      payout.failureReason || '',
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payouts-${status}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting payouts:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to export payouts' },
      { status: 500 }
    );
  }
}