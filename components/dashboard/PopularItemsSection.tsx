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

interface PopularItemsSectionProps {
  vendorId?: string
}

export default function PopularItemsSection({ vendorId }: PopularItemsSectionProps) {
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPopularItems()
  }, [])

  const fetchPopularItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendor/analytics?period=month')
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
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-36 h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (popularItems.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Popular Items (This Month)</h2>
        </div>
        <p className="text-sm text-gray-600">No popular items yet. Start receiving orders to see your top sellers!</p>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-bold text-gray-900">Popular Items (This Month)</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {popularItems.map((item, index) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-36 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative"
          >
            {/* Rank Badge */}
            <div className="absolute top-2 left-2 z-10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                #{index + 1}
              </div>
            </div>

            {/* Item Image */}
            <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-orange-200 to-orange-300">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Item Info */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900 truncate" title={item.name}>
                {item.name}
              </h3>
              <p className="text-xs text-gray-600">
                <span className="font-medium">{item.categoryName}</span> • {item.orderCount} orders
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}