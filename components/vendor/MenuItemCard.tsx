'use client'

import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Utensils } from 'lucide-react'
import Switch from '@/components/ui/Switch'
import Image from 'next/image'

interface MenuItemCardProps {
  item: {
    id: string
    name: string
    nameRw?: string | null
    description?: string | null
    price: number
    imageUrl?: string | null
    isAvailable: boolean
    category: {
      id: string
      name: string
      nameRw?: string | null
    }
  }
  onClick: () => void
  onToggleAvailability: (itemId: string, newAvailability: boolean) => Promise<void>
}

export default function MenuItemCard({
  item,
  onClick,
  onToggleAvailability,
}: MenuItemCardProps) {
  const handleToggle = async (checked: boolean) => {
    try {
      await onToggleAvailability(item.id, checked)
    } catch (error) {
      console.error('Failed to toggle availability:', error)
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-lg border border-white/20 shadow-glass',
        'transition-all duration-200',
        'hover:shadow-glass-hover hover:scale-[1.01]'
      )}
    >
      {/* Card content */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Image section */}
          <div
            onClick={onClick}
            className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Utensils className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Content section */}
          <div className="flex-1 min-w-0">
            <div onClick={onClick} className="cursor-pointer">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.category.name}
              </p>
              <p className="text-base font-semibold text-primary-500 mt-2">
                {formatCurrency(item.price)}
              </p>
            </div>

            {/* Availability toggle */}
            <div className="flex items-center gap-2 mt-3">
              <Switch
                checked={item.isAvailable}
                onChange={handleToggle}
                size="sm"
              />
              <span className="text-xs text-gray-600">
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}