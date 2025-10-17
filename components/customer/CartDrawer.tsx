'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, X } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CartDrawer() {
  const router = useRouter()
  const {
    items,
    vendorSlug,
    isDrawerOpen,
    closeDrawer,
    incrementQuantity,
    decrementQuantity,
    itemCount,
    subtotal,
  } = useCartStore()

  const count = itemCount()
  const total = subtotal()

  if (!isDrawerOpen) return null

  const handleCheckout = () => {
    if (vendorSlug) {
      closeDrawer()
      router.push(`/${vendorSlug}/checkout`)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white/95 backdrop-blur-lg',
          'rounded-t-3xl shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          'max-h-[70vh] flex flex-col',
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Your Cart ({count})
            </h2>
            <button
              onClick={closeDrawer}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Add items from the menu below
            </p>
            <Button onClick={closeDrawer} variant="outline">
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex gap-4 p-4 bg-white/60 rounded-xl border border-gray-200"
                >
                  {/* Item Image */}
                  {item.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.price)} each
                    </p>

                    {/* Line Total */}
                    <p className="font-bold text-gray-900 mt-1">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementQuantity(item.menuItemId)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="font-bold text-gray-900 w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => incrementQuantity(item.menuItemId)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Totals and Checkout Button */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Delivery fee will be calculated at checkout
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                fullWidth
                className="min-h-touch"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}