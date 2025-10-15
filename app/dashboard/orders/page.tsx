'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import OrderCard from '@/components/vendor/OrderCard'
import OrderDetailModal from '@/components/vendor/OrderDetailModal'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
type FilterStatus = 'all' | OrderStatus

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
  status: OrderStatus
  items: Array<{
    id: string
    name: string
    nameRw: string | null
    quantity: number
    price: number
    subtotal: number
    notes: string | null
  }>
  createdAt: string
  vendorId: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch initial orders
  useEffect(() => {
    fetchOrders()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!vendorId) return

    const supabase = createClient()

    const channel = supabase
      .channel('vendor-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Order',
          filter: `vendorId=eq.${vendorId}`
        },
        (payload) => {
          handleNewOrder(payload.new as Order)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `vendorId=eq.${vendorId}`
        },
        (payload) => {
          handleOrderUpdate(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId])

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/vendor/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const data = await response.json()
      setOrders(data.orders)

      // Get vendor ID for real-time subscriptions
      if (data.orders.length > 0) {
        setVendorId(data.orders[0].vendorId)
      }
    } catch (error) {
      console.error('Fetch orders error:', error)
      setToastMessage({ type: 'error', message: 'Failed to load orders' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewOrder = async (newOrderData: Order) => {
    // Fetch complete order with items
    try {
      const response = await fetch('/api/vendor/orders')
      const { orders: allOrders } = await response.json()
      const fullOrder = allOrders.find((o: Order) => o.id === newOrderData.id)

      if (fullOrder) {
        setOrders((prev) => [fullOrder, ...prev])
        playNotificationSound()
        setToastMessage({
          type: 'success',
          message: `New order received! ${fullOrder.orderNumber} from ${fullOrder.customerName}`
        })
      }
    } catch (error) {
      console.error('Handle new order error:', error)
    }
  }

  const handleOrderUpdate = (updatedOrderData: Order) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrderData.id
          ? { ...order, ...updatedOrderData }
          : order
      )
    )
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      const { order: updatedOrder } = await response.json()

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      )

      setToastMessage({ type: 'success', message: 'Order status updated' })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Update order error:', error)
      setToastMessage({ type: 'error', message: 'Failed to update order' })
      throw error
    }
  }

  const getFilteredOrders = () => {
    if (selectedFilter === 'all') {
      return orders
    }
    return orders.filter((order) => order.status === selectedFilter)
  }

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return orders.length
    return orders.filter((order) => order.status === status).length
  }

  const filteredOrders = getFilteredOrders()

  const filterChips: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' },
    { label: 'Completed', value: 'completed' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage your incoming orders in real-time
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl p-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setSelectedFilter(chip.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all min-h-touch',
                selectedFilter === chip.value
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-700 hover:bg-white/80'
              )}
            >
              <span className="font-medium">{chip.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  selectedFilter === chip.value
                    ? 'bg-white/30'
                    : 'bg-gray-200'
                )}
              >
                {getStatusCount(chip.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedFilter === 'all' ? 'No orders yet' : `No ${selectedFilter} orders`}
          </h3>
          <p className="text-gray-600">
            When customers place orders, they'll appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => {
                setSelectedOrder(order)
                setIsModalOpen(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-down">
          <div
            className={cn(
              'rounded-xl border p-4 shadow-lg backdrop-blur-md',
              toastMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-red-50 border-red-200 text-red-900'
            )}
          >
            <p className="text-sm font-medium">{toastMessage.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
