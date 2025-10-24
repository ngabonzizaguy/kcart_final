import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics'
import QuickActionsSection from '@/components/dashboard/QuickActionsSection'
import TodayPopularItems from '@/components/dashboard/TodayPopularItems'

// Helper to get Rwanda timezone date
function getRwandaDate() {
  // Rwanda is UTC+2
  const now = new Date()
  const rwandaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kigali' }))
  return rwandaTime
}

function getRwandaTodayStart() {
  const rwandaNow = getRwandaDate()
  const todayStart = new Date(rwandaNow)
  todayStart.setHours(0, 0, 0, 0)
  return todayStart
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const vendor = await prisma.vendor.findUnique({
    where: { authId: user.id },
    include: {
      _count: {
        select: {
          orders: true,
          menuItems: true,
          categories: true,
        },
      },
    },
  })

  if (!vendor) {
    return null
  }

  // Get today's orders using Rwanda timezone
  const todayStart = getRwandaTodayStart()

  const todayOrders = await prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      createdAt: {
        gte: todayStart,
      },
    },
  })

  const todayRevenue = todayOrders.reduce((sum: number, order: typeof todayOrders[number]) => sum + order.total, 0)

  const todayStats = {
    totalOrders: todayOrders.length,
    totalRevenue: todayRevenue,
    averageOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {vendor.businessName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Analytics with Tabs */}
      <DashboardAnalytics
        initialData={todayStats}
        menuItemsCount={vendor._count.menuItems}
        vendorId={vendor.id}
      />

      {/* Today's Popular Items */}
      <TodayPopularItems vendorId={vendor.id} />

      {/* Quick Actions */}
      <QuickActionsSection vendorSlug={vendor.slug} />
    </div>
  )
}