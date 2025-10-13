import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if vendor profile exists
  const vendor = await prisma.vendor.findUnique({
    where: { authId: user.id },
  })

  // If vendor profile doesn't exist or onboarding not complete, redirect to onboarding
  if (!vendor || !vendor.isSetupComplete) {
    redirect('/onboarding/business-info')
  }

  const translations = {
    home: 'Home',
    orders: 'Orders',
    menu: 'Menu',
    analytics: 'Analytics',
    profile: 'Profile',
    logout: 'Logout',
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <Sidebar locale="en" translations={translations} />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav translations={translations} />
    </div>
  )
}
