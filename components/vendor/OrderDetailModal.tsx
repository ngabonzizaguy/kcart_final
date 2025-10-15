'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerPhone: string
    customerEmail: string | null
    deliveryType: 'delivery' | 'pickup'
    deliveryAddress: string | null
    deliveryNotes: string | null
    subtotal: number
    deliveryFee: number
    total: number
    status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
    items: Array<{
      id: string
      name: string
      nameRw: string | null
      quantity: number
      price: number
      subtotal: number
      notes: string | null
    }>
    createdAt: Date | string
  } | null
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>
}

const statusBadgeColors = {
  new: 'bg-[#ff9800] text-white',
  preparing: 'bg-[#2196f3] text-white',
  ready: 'bg-[#4caf50] text-white',
  completed: 'bg-[#757575] text-white',
  cancelled: 'bg-[#f44336] text-white',
}

const statusLabels = {
  new: 'NEW ORDER',
  preparing: 'PREPARING',
  ready: 'READY FOR PICKUP',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusUpdate,
}: OrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (!order) return null

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      await onStatusUpdate(order.id, newStatus)
      onClose()
    } catch (error) {
      console.error('Status update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = async () => {
    await handleStatusUpdate('cancelled')
    setShowCancelConfirm(false)
  }

  const getActionButtons = () => {
    if (order.status === 'completed' || order.status === 'cancelled') {
      return null
    }

    return (
      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        {order.status !== 'cancelled' && (
          <Button
            variant="secondary"
            fullWidth
            onClick={handleCancelOrder}
            disabled={isUpdating}
          >
            Cancel Order
          </Button>
        )}

        {order.status === 'new' && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleStatusUpdate('preparing')}
            loading={isUpdating}
          >
            Accept & Prepare
          </Button>
        )}

        {order.status === 'preparing' && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleStatusUpdate('ready')}
            loading={isUpdating}
          >
            Mark as Ready
          </Button>
        )}

        {order.status === 'ready' && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => handleStatusUpdate('completed')}
            loading={isUpdating}
          >
            Mark as Completed
          </Button>
        )}
      </div>
    )
  }

  if (showCancelConfirm) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancel Order"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to cancel this order?
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowCancelConfirm(false)}
              disabled={isUpdating}
            >
              Go Back
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={confirmCancel}
              loading={isUpdating}
            >
              Yes, Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order.orderNumber}
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div>
          <span
            className={cn(
              'inline-block px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide',
              statusBadgeColors[order.status]
            )}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Customer Section */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-gray-600 tracking-wide mb-2">
            CUSTOMER
          </h4>
          <div className="space-y-1">
            <p className="text-base font-semibold text-gray-900">
              {order.customerName}
            </p>
            <p className="text-sm text-gray-700">{order.customerPhone}</p>
            {order.customerEmail && (
              <p className="text-sm text-gray-700">{order.customerEmail}</p>
            )}
          </div>
        </div>

        {/* Delivery Info Section */}
        {order.deliveryType === 'delivery' && (
          <div>
            <h4 className="text-[11px] uppercase font-bold text-gray-600 tracking-wide mb-2">
              DELIVERY INFO
            </h4>
            <div className="space-y-1 text-sm leading-relaxed">
              <p className="text-gray-700">
                <span className="font-medium">Type:</span> Delivery
              </p>
              {order.deliveryAddress && (
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span> {order.deliveryAddress}
                </p>
              )}
              {order.deliveryNotes && (
                <p className="text-gray-700">
                  <span className="font-medium">Notes:</span> {order.deliveryNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {order.deliveryType === 'pickup' && (
          <div>
            <h4 className="text-[11px] uppercase font-bold text-gray-600 tracking-wide mb-2">
              PICKUP ORDER
            </h4>
            <p className="text-sm text-gray-700">Customer will pick up order</p>
          </div>
        )}

        {/* Order Items Section */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-gray-600 tracking-wide mb-2">
            ORDER ITEMS
          </h4>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{item.quantity}x</span> {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="space-y-2 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(order.subtotal)}
            </span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Delivery Fee</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(order.deliveryFee)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span className="text-gray-900">TOTAL</span>
            <span className="text-gray-900">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {getActionButtons()}
      </div>
    </Modal>
  )
}
