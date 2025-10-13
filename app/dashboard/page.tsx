import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
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

  // Get today's orders
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
    orders: todayOrders.length,
    sales: todayOrders.reduce((sum, order) => sum + order.total, 0),
  }

  // Get this week's orders
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const weekOrders = await prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      createdAt: {
        gte: weekAgo,
      },
    },
  })

  const weekStats = {
    orders: weekOrders.length,
    sales: weekOrders.reduce((sum, order) => sum + order.total, 0),
  }

  // Get this month's orders
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)

  const monthOrders = await prisma.order.findMany({
    where: {
      vendorId: vendor.id,
      createdAt: {
        gte: monthAgo,
      },
    },
  })

  const monthStats = {
    orders: monthOrders.length,
    sales: monthOrders.reduce((sum, order) => sum + order.total, 0),
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

      {/* Today Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {todayStats.orders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(todayStats.sales)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-status-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {vendor._count.menuItems}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* This Week Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {weekStats.orders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(weekStats.sales)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-status-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* This Month Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">This Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {monthStats.orders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(monthStats.sales)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-status-success" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a
                href="/dashboard/menu"
                className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-center"
              >
                <p className="font-medium text-primary-700">Manage Menu</p>
              </a>
              <a
                href="/dashboard/orders"
                className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-center"
              >
                <p className="font-medium text-primary-700">View Orders</p>
              </a>
              <a
                href={`/${vendor.slug}`}
                target="_blank"
                className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-center"
              >
                <p className="font-medium text-primary-700">View Storefront</p>
              </a>
              <a
                href="/dashboard/profile"
                className="p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-center"
              >
                <p className="font-medium text-primary-700">Settings</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
