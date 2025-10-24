'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

interface PopularItem {
  id: string
  name: string
  categoryName: string
  orderCount: number
  imageUrl: string | null
}

interface TodayPopularItemsProps {
  vendorId: string
}

export default function TodayPopularItems({ vendorId }: TodayPopularItemsProps) {
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPopularItems()
  }, [])

  const fetchPopularItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendor/analytics?period=today&includePopular=true')
      if (!response.ok) {
        throw new Error('Failed to fetch popular items')
      }
      const data = await response.json()
      setPopularItems(data.popularItems?.slice(0, 5) || [])
    } catch (error) {
      console.error('Fetch popular items error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-24 h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (popularItems.length === 0) {
    return null // Don't show if no popular items
  }

  return (
    <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-orange-600" />
        <h3 className="text-sm font-bold text-gray-900">Top 5 Today</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {popularItems.map((item, index) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-24 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-2 shadow-sm relative"
          >
            {/* Rank Badge */}
            <div className="absolute top-1 left-1 z-10">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold shadow">
                {index + 1}
              </div>
            </div>

            {/* Item Image */}
            <div className="w-full h-16 rounded-lg overflow-hidden mb-1.5 bg-gradient-to-br from-orange-200 to-orange-300">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Item Info */}
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-gray-900 truncate" title={item.name}>
                {item.name}
              </h4>
              <p className="text-[10px] text-gray-600 truncate">
                {item.orderCount} orders
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}