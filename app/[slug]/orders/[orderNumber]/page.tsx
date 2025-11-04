'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import OrderStatus from '@/components/customer/OrderStatus'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

type OrderStatusType = 'new' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled'

interface OrderItem {
  id: string
  name: string
  nameRw: string | null
  quantity: number
  price: number
  subtotal: number
  notes: string | null
}

interface Order {
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
  status: OrderStatusType
  createdAt: string
  vendorId: string
  vendor: {
    businessName: string
    logoUrl: string | null
  }
  items: OrderItem[]
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const slug = params.slug as string
  const orderNumber = params.orderNumber as string

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/customer/orders/${orderNumber}`)

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true)
          } else {
            throw new Error('Failed to fetch order')
          }
          return
        }

        const data = await response.json()
        setOrder(data.order)
      } catch (error) {
        console.error('Fetch order error:', error)
        showToast({
          type: 'error',
          message: 'Failed to load order',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber, showToast])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!order) return

    const supabase = createClient()

    const channel = supabase
      .channel('order-tracking')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `orderNumber=eq.${orderNumber}`,
        },
        (payload) => {
          const updatedOrder = payload.new as any

          setOrder((prev) => {
            if (!prev) return null
            return { ...prev, status: updatedOrder.status }
          })

          // Show toast notification on status change
          const statusMessages: Record<OrderStatusType, string> = {
            new: 'Your order has been received',
            preparing: 'Your order is now being prepared',
            ready: `Your order is ready for ${order.deliveryType}`,
            delivered: 'Your order has been delivered. Thank you!',
            completed: 'Your order is completed',
            cancelled: 'Your order has been cancelled',
          }

          showToast({
            type: updatedOrder.status === 'cancelled' ? 'error' : 'success',
            message: statusMessages[updatedOrder.status as OrderStatusType],
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [order, orderNumber, showToast])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find an order with this number.
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${slug}`)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Menu</span>
        </button>

        {/* Order Header */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {order.vendor.logoUrl && (
              <img
                src={order.vendor.logoUrl}
                alt={order.vendor.businessName}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.vendor.businessName}
              </h1>
              <p className="text-gray-600">Order #{orderNumber}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Ordered {formatRelativeTime(order.createdAt)}
          </p>
        </Card>

        {/* Order Status */}
        <Card className="p-6">
          <OrderStatus currentStatus={order.status} />
        </Card>

        {/* Order Details */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Order Details
          </h2>

          {/* Items */}
          <div className="space-y-3 mb-6">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.quantity}× {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Delivery Fee:</span>
                <span className="font-semibold">
                  {formatCurrency(order.deliveryFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="mt-6 pt-6 border-t grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Customer Information
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{order.customerName}</p>
                <p>{order.customerPhone}</p>
                {order.customerEmail && <p>{order.customerEmail}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Delivery Information
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium capitalize">{order.deliveryType}</p>
                {order.deliveryAddress && <p>{order.deliveryAddress}</p>}
                {order.deliveryNotes && (
                  <p className="text-gray-600 italic">
                    Note: {order.deliveryNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-center">
          <Button
            onClick={() => router.push(`/${slug}`)}
            variant="outline"
            className="min-w-[200px]"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  )
}