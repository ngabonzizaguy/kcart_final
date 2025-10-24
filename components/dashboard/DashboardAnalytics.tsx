'use client'

import { useState, useEffect, useRef } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import { ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

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
  vendorId: string
}

export default function DashboardAnalytics({ initialData, menuItemsCount, vendorId }: DashboardAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<Period>('today')
  const [cachedData, setCachedData] = useState<Record<Period, AnalyticsData | null>>({
    today: initialData,
    week: null,
    month: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)

  // Initialize audio element for notification sound
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
      // Using a data URL for a simple notification beep
      audioRef.current.src = 'data:audio/wav;base64,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'
    }
  }, [])

  // Set up realtime subscription for new orders
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order',
          filter: `vendorId=eq.${vendorId}`
        },
        async (payload: any) => {
          const newOrder = payload.new

          // Play notification sound (only once per page load to avoid spam)
          if (audioRef.current && !hasPlayedSound) {
            try {
              await audioRef.current.play()
              setHasPlayedSound(true)
              // Reset after 3 seconds to allow next notification
              setTimeout(() => setHasPlayedSound(false), 3000)
            } catch (error) {
              console.log('Audio play failed:', error)
            }
          }

          // Update today's stats in real-time
          if (activeTab === 'today') {
            setCachedData(prev => {
              const todayData = prev.today
              if (todayData) {
                const newTotalOrders = todayData.totalOrders + 1
                const newTotalRevenue = todayData.totalRevenue + newOrder.total
                return {
                  ...prev,
                  today: {
                    totalOrders: newTotalOrders,
                    totalRevenue: newTotalRevenue,
                    averageOrderValue: newTotalRevenue / newTotalOrders,
                  }
                }
              }
              return prev
            })
          }

          // Invalidate week and month cache to refetch on next tab click
          setCachedData(prev => ({
            ...prev,
            week: null,
            month: null,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId, activeTab, hasPlayedSound])

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

      // Ensure we never show NaN - default to 0
      const avgOrderValue = data.averageOrderValue || 0
      const totalRevenue = data.totalRevenue || 0
      const totalOrders = data.totalOrders || 0

      setCachedData(prev => ({
        ...prev,
        [period]: {
          totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
          totalOrders: isNaN(totalOrders) ? 0 : totalOrders,
          averageOrderValue: isNaN(avgOrderValue) ? 0 : avgOrderValue,
        }
      }))
    } catch (error) {
      console.error('Fetch analytics error:', error)
      // Set default values on error
      setCachedData(prev => ({
        ...prev,
        [period]: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const currentData = cachedData[activeTab]

  // Safe formatting with NaN check
  const safeFormatCurrency = (value: number) => {
    return formatCurrency(isNaN(value) ? 0 : value)
  }

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
                    {currentData.totalOrders || 0}
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
                    {safeFormatCurrency(currentData.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-status-success" />
              </div>
            </CardContent>
          </Card>

          {/* Average Order Value or Menu Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {activeTab === 'today' ? 'Menu Items' : 'Avg Order'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {activeTab === 'today'
                      ? menuItemsCount
                      : safeFormatCurrency(currentData.averageOrderValue)}
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