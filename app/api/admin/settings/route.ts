import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/roleCheck';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    // Get or create platform settings (singleton)
    let settings = await prisma.platformSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.platformSettings.create({
        data: {
          globalCommissionPercentage: 15.0,
          payoutAutomationEnabled: false,
          payoutSchedule: 'weekly',
          minimumPayoutAmount: 10000,
          acceptedPaymentMethods: ['cash_on_delivery', 'mtn_mobile_money', 'airtel_mobile_money'],
          platformName: 'DeliGo',
          supportEmail: 'support@deligo.com',
          timezone: 'Africa/Kigali',
          locale: 'en',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    // Get current settings
    let settings = await prisma.platformSettings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found. Please refresh and try again.' },
        { status: 404 }
      );
    }

    // Track what changed for admin log
    const changes: any = {};
    Object.keys(body).forEach((key) => {
      if (body[key] !== (settings as any)[key]) {
        changes[key] = {
          from: (settings as any)[key],
          to: body[key],
        };
      }
    });

    // Update settings
    settings = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: body,
    });

    // Create admin log
    if (Object.keys(changes).length > 0) {
      await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'settings_updated',
          targetType: 'settings',
          targetId: settings.id,
          details: {
            changes,
            updatedFields: Object.keys(changes),
          },
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);

    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}