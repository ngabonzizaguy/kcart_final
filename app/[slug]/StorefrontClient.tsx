'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CartDrawer from '@/components/customer/CartDrawer'
import { ShoppingCart, MapPin, Clock, Phone } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  nameRw: string | null
  description: string | null
  descriptionRw: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
}

interface Category {
  id: string
  name: string
  nameRw: string | null
  description: string | null
  sortOrder: number
  menuItems: MenuItem[]
}

// CORRECTED: Changed bannerUrl → coverUrl, businessAddress → address
interface Vendor {
  id: string
  slug: string
  businessName: string
  businessNameRw: string | null
  description: string | null
  descriptionRw: string | null
  logoUrl: string | null
  coverUrl: string | null        // ✅ Changed from bannerUrl
  address: string | null          // ✅ Changed from businessAddress
  businessPhone: string | null
  isOnline: boolean
  deliveryFee: number
  categories: Category[]
}

interface StorefrontClientProps {
  vendor: Vendor
}

export default function StorefrontClient({ vendor }: StorefrontClientProps) {
  const { itemCount, addItem, openDrawer } = useCartStore()
  const count = itemCount()

  const handleAddToCart = (item: MenuItem) => {
    addItem(
      vendor.id,
      vendor.slug,
      vendor.businessName,
      vendor.deliveryFee,
      {
        menuItemId: item.id,
        name: item.name,
        nameRw: item.nameRw,
        price: item.price,
        imageUrl: item.imageUrl,
      }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-warm pb-24">
      {/* Banner - FIXED: Changed bannerUrl to coverUrl */}
      {vendor.coverUrl && (
        <div className="w-full h-48 md:h-64">
          <img
            src={vendor.coverUrl}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Vendor Header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-start gap-4 mb-6">
          {vendor.logoUrl && (
            <img
              src={vendor.logoUrl}
              alt={vendor.businessName}
              className="w-20 h-20 rounded-xl object-cover shadow-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {vendor.businessName}
              </h1>
              {vendor.isOnline ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  Open
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  Closed
                </span>
              )}
            </div>
            {vendor.description && (
              <p className="text-gray-600 mb-3">{vendor.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {/* FIXED: Changed businessAddress to address */}
              {vendor.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{vendor.address}</span>
                </div>
              )}
              {vendor.businessPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{vendor.businessPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Delivery: {formatCurrency(vendor.deliveryFee)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Offline Banner */}
        {!vendor.isOnline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700 font-medium">
              This restaurant is currently closed and not accepting orders.
            </p>
          </div>
        )}

        {/* Menu Categories */}
        <div className="space-y-8">
          {vendor.categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.menuItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.imageUrl && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(item.price)}
                        </span>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={!vendor.isOnline || !item.isAvailable}
                          size="sm"
                        >
                          {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {vendor.categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No menu items available yet.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {count > 0 && (
        <button
          onClick={openDrawer}
          className="fixed bottom-6 right-6 bg-primary-500 text-white rounded-full p-4 shadow-2xl hover:bg-primary-600 transition-all hover:scale-110 z-30"
          aria-label="View cart"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {count}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  )
}