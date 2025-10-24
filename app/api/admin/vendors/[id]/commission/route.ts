import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { commissionPercentage } = body;

    if (typeof commissionPercentage !== 'number' || commissionPercentage < 0 || commissionPercentage > 100) {
      return NextResponse.json(
        { error: 'Invalid commission percentage (must be 0-100)' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if vendor-specific commission setting exists
    const existingSetting = await prisma.commissionSettings.findFirst({
      where: { vendorId: params.id },
    });

    let commissionSettings;

    if (existingSetting) {
      // Update existing setting
      commissionSettings = await prisma.commissionSettings.update({
        where: { id: existingSetting.id },
        data: {
          commissionPercentage,
          isActive: true,
          updatedBy: admin.id,
        },
      });
    } else {
      // Create new vendor-specific setting
      commissionSettings = await prisma.commissionSettings.create({
        data: {
          vendorId: params.id,
          commissionPercentage,
          isActive: true,
          updatedBy: admin.id,
        },
      });
    }

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'commission_updated',
        targetType: 'vendor',
        targetId: params.id,
        details: {
          vendorName: vendor.businessName,
          previousRate: existingSetting?.commissionPercentage || 'Global',
          newRate: commissionPercentage,
        },
      },
    });

    return NextResponse.json({
      success: true,
      commissionSettings,
    });
  } catch (error: any) {
    console.error('Error updating commission:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update commission' },
      { status: 500 }
    );
  }
}