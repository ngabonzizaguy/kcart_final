'use client'

import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface OrderCardProps {
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    deliveryType: 'delivery' | 'pickup'
    total: number
    status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    items: { quantity: number }[]
    createdAt: Date | string
  }
  onClick: () => void
}

const statusColors = {
  new: '#ff9800',
  preparing: '#ff9800',
  ready: '#4caf50',
  completed: '#4caf50',
  cancelled: '#f44336',
}

const statusLabels = {
  new: 'NEW',
  preparing: 'PREPARING',
  ready: 'READY',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const statusColor = statusColors[order.status]
  const isNew = order.status === 'new'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-lg border border-white/20 shadow-glass',
        'transition-all duration-200 cursor-pointer',
        'hover:shadow-glass-hover hover:scale-[1.01]',
        isNew && 'animate-pulse-subtle'
      )}
    >
      {/* Status bar at top */}
      <div
        className="h-1"
        style={{ backgroundColor: statusColor }}
      />

      {/* Card content */}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-lg font-bold text-primary-500">
            {order.orderNumber}
          </span>
          <span
            className="text-[11px] uppercase tracking-wide font-medium"
            style={{ color: '#666', letterSpacing: '0.5px' }}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Customer info */}
        <div className="space-y-1 mb-3">
          <p className="text-sm font-medium text-gray-900">
            {order.customerName}
          </p>
          <p className="text-[13px] text-gray-600">
            {order.customerPhone}
          </p>
          <p className="text-xs text-gray-500">
            {formatRelativeTime(order.createdAt)}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-3" />

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600">
            {order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} • {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
          <span className="text-[15px] font-semibold text-gray-900">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
