'use client'

import { useState, useEffect } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

type Period = 'today' | 'week' | 'month'

interface AnalyticsData {
  salesData: Array<{ date: string; value: number }>
  ordersData: Array<{ date: string; count: number }>
  popularItems: Array<{
    id: string
    name: string
    nameRw: string | null
    orderCount: number
    revenue: number
    imageUrl: string | null
  }>
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/vendor/analytics?period=${selectedPeriod}`)

      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
      console.error('Analytics fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const periodTabs: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' }
  ]

  const hasData = data && (
    data.salesData.some(d => d.value > 0) ||
    data.ordersData.some(d => d.count > 0) ||
    data.popularItems.length > 0
  )

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track your sales and order trends
        </p>
      </div>

      {/* Time Period Tabs */}
      <div className="flex gap-2">
        {periodTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSelectedPeriod(tab.value)}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all ${
              selectedPeriod === tab.value
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                : 'bg-white/60 backdrop-blur-lg border border-white/20 text-gray-700 hover:bg-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          {/* Sales chart skeleton */}
          <Card className="bg-white/60 backdrop-blur-lg border border-white/20">
            <CardContent className="pt-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>

          {/* Orders chart skeleton */}
          <Card className="bg-white/60 backdrop-blur-lg border border-white/20">
            <CardContent className="pt-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-64 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>

          {/* Popular items skeleton */}
          <Card className="bg-white/60 backdrop-blur-lg border border-white/20">
            <CardContent className="pt-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && data && (
        <>
          {/* Empty State */}
          {!hasData && (
            <Card className="bg-white/60 backdrop-blur-lg border border-white/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No data for this period
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Share your menu link to start receiving orders
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales Revenue Chart */}
          {hasData && (
            <>
              <Card className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Sales Revenue
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid rgba(255, 127, 42, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Sales']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ff7f2a"
                        strokeWidth={2}
                        dot={{ fill: '#ff7f2a', r: 4 }}
                        activeDot={{ r: 6, fill: '#ff7f2a', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order Volume Chart */}
              <Card className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Order Volume
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data.ordersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                        formatter={(value: number) => [value, 'Orders']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4caf50"
                        strokeWidth={2}
                        dot={{ fill: '#4caf50', r: 4 }}
                        activeDot={{ r: 6, fill: '#4caf50', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Popular Items */}
              <Card className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Top 5 Popular Items
                  </h2>

                  {data.popularItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No items ordered yet
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3">
                      {data.popularItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-2xl font-bold text-primary-500">
                              #{index + 1}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {item.orderCount} {item.orderCount === 1 ? 'order' : 'orders'}
                          </p>
                          <p className="text-sm font-semibold text-status-success">
                            {formatCurrency(item.revenue)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
