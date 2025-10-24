import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics'
import QuickActionsSection from '@/components/dashboard/QuickActionsSection'
import { ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

  // Get today's orders for initial data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayOrders = await prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      createdAt: {
        gte: today,
      },
    },
  })

  const todayStats = {
    totalOrders: todayOrders.length,
    totalRevenue: todayOrders.reduce((sum: number, order: typeof todayOrders[number]) => sum + order.total, 0),
    averageOrderValue: todayOrders.length > 0 
      ? todayOrders.reduce((sum: number, order: typeof todayOrders[number]) => sum + order.total, 0) / todayOrders.length 
      : 0,
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
      />

      {/* Quick Actions */}
      <QuickActionsSection vendorSlug={vendor.slug} />
    </div>
  )
}