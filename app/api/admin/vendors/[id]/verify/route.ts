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
    const { verified } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid verified value' },
        { status: 400 }
      );
    }

    // Update vendor verification status
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: { isVerified: verified },
    });

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: verified ? 'vendor_verified' : 'vendor_unverified',
        targetType: 'vendor',
        targetId: params.id,
        details: {
          vendorName: vendor.businessName,
          previousStatus: !verified,
          newStatus: verified,
        },
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error: any) {
    console.error('Error updating vendor verification:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update vendor verification' },
      { status: 500 }
    );
  }
}