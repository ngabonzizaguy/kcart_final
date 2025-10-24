import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const targetType = searchParams.get('targetType') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const where: any = {};

    if (targetType !== 'all') {
      where.targetType = targetType;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDate;
      }
    }

    // Fetch all logs for export
    const logs = await prisma.adminLog.findMany({
      where,
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

    // Generate CSV content
    const headers = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Action',
      'Target Type',
      'Target ID',
      'Details',
      'IP Address',
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.admin.name,
      log.admin.email,
      log.action,
      log.targetType,
      log.targetId,
      JSON.stringify(log.details).replace(/"/g, '""'),
      log.ipAddress || '',
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="admin-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting logs:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    );
  }
}