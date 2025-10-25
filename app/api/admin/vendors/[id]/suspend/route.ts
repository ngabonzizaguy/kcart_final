import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { suspended, reason } = body;

    if (typeof suspended !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid suspended value' },
        { status: 400 }
      );
    }

    // Update vendor suspension status
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: { isSuspended: suspended },
    });

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: suspended ? 'vendor_suspended' : 'vendor_reactivated',
        targetType: 'vendor',
        targetId: params.id,
        details: {
          vendorName: vendor.businessName,
          reason: reason || (suspended ? 'No reason provided' : 'Reactivated by admin'),
          previousStatus: !suspended,
          newStatus: suspended,
        },
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error: any) {
    console.error('Error updating vendor suspension:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update vendor suspension' },
      { status: 500 }
    );
  }
}