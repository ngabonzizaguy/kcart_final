// Admin and Vendor Role Checking Utilities
// Used in middleware and API routes for authorization

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * Get admin user by Supabase Auth ID
 * Returns null if not found
 */
export async function getAdminByAuthId(authId: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { authId },
      select: {
        id: true,
        authId: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return admin;
  } catch (error) {
    console.error('Error fetching admin by authId:', error);
    return null;
  }
}

/**
 * Get vendor user by Supabase Auth ID
 * Returns null if not found
 */
export async function getVendorByAuthId(authId: string) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { authId },
      select: {
        id: true,
        authId: true,
        email: true,
        businessName: true,
        slug: true,
        isVerified: true,
        isSuspended: true,
      },
    });
    return vendor;
  } catch (error) {
    console.error('Error fetching vendor by authId:', error);
    return null;
  }
}

/**
 * Get current authenticated user from Supabase
 * Returns { user, error }
 */
export async function getCurrentUser() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  return { user, error };
}

/**
 * Require admin authentication
 * Throws error if not authenticated or not an admin
 * Returns admin record on success
 */
export async function requireAdmin() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const admin = await getAdminByAuthId(user.id);

  if (!admin) {
    throw new Error('Forbidden: Admin access required');
  }

  // Update last login timestamp
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {
    // Silently fail - not critical
  });

  return admin;
}

/**
 * Require vendor authentication
 * Throws error if not authenticated or not a vendor
 * Returns vendor record on success
 */
export async function requireVendor() {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  const vendor = await getVendorByAuthId(user.id);

  if (!vendor) {
    throw new Error('Forbidden: Vendor access required');
  }

  if (vendor.isSuspended) {
    throw new Error('Forbidden: Account suspended');
  }

  return vendor;
}

/**
 * Check if current user is admin
 * Returns boolean without throwing
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    const admin = await getAdminByAuthId(user.id);
    return admin !== null;
  } catch {
    return false;
  }
}

/**
 * Check if current user is vendor
 * Returns boolean without throwing
 */
export async function isVendor(): Promise<boolean> {
  try {
    const { user } = await getCurrentUser();
    if (!user) return false;

    const vendor = await getVendorByAuthId(user.id);
    return vendor !== null && !vendor.isSuspended;
  } catch {
    return false;
  }
}