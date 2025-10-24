'use client'

import { useState } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import { ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Period = 'today' | 'week' | 'month'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  menuItemsCount?: number
}

interface DashboardAnalyticsProps {
  initialData: AnalyticsData
  menuItemsCount: number
}

export default function DashboardAnalytics({ initialData, menuItemsCount }: DashboardAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<Period>('today')
  const [cachedData, setCachedData] = useState<Record<Period, AnalyticsData | null>>({
    today: initialData,
    week: null,
    month: null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleTabClick = async (period: Period) => {
    setActiveTab(period)

    // If data is already cached, use it
    if (cachedData[period]) {
      return
    }

    // Fetch data from API
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vendor/analytics?period=${period}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()

      setCachedData(prev => ({
        ...prev,
        [period]: {
          totalRevenue: data.totalRevenue,
          totalOrders: data.totalOrders,
          averageOrderValue: data.averageOrderValue,
        }
      }))
    } catch (error) {
      console.error('Fetch analytics error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentData = cachedData[activeTab]

  return (
    <section className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabClick('today')}
          className={cn(
            'px-6 py-3 rounded-xl font-semibold text-sm transition-all backdrop-blur-md',
            activeTab === 'today'
              ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white shadow-lg'
              : 'bg-gradient-to-r from-amber-100 to-orange-100 text-gray-700 hover:from-amber-200 hover:to-orange-200'
          )}
        >
          Today
        </button>
        <button
          onClick={() => handleTabClick('week')}
          className={cn(
            'px-6 py-3 rounded-xl font-semibold text-sm transition-all backdrop-blur-md',
            activeTab === 'week'
              ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white shadow-lg'
              : 'bg-gradient-to-r from-amber-100 to-orange-100 text-gray-700 hover:from-amber-200 hover:to-orange-200'
          )}
        >
          Week
        </button>
        <button
          onClick={() => handleTabClick('month')}
          className={cn(
            'px-6 py-3 rounded-xl font-semibold text-sm transition-all backdrop-blur-md',
            activeTab === 'month'
              ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white shadow-lg'
              : 'bg-gradient-to-r from-amber-100 to-orange-100 text-gray-700 hover:from-amber-200 hover:to-orange-200'
          )}
        >
          Month
        </button>
      </div>

      {/* Analytics Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Orders */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {currentData.totalOrders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(currentData.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-status-success" />
              </div>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {activeTab === 'today' ? 'Menu Items' : 'Avg Order Value'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {activeTab === 'today'
                      ? menuItemsCount
                      : formatCurrency(currentData.averageOrderValue)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  )
}