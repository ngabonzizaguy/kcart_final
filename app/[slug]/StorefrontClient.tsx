'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import CartDrawer from '@/components/customer/CartDrawer'
import { ShoppingCart, MapPin, Clock, Phone, Star } from 'lucide-react'

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

interface Review {
  id: string
  customerName: string
  rating: number
  comment: string
  createdAt: Date | string
}

interface Vendor {
  id: string
  slug: string
  businessName: string
  businessNameRw: string | null
  description: string | null
  descriptionRw: string | null
  logoUrl: string | null
  coverUrl: string | null
  address: string | null
  businessPhone: string | null
  isOnline: boolean
  deliveryFee: number
  cuisineTags: string[]
  categories: Category[]
  reviews: Review[]
}

interface StorefrontClientProps {
  vendor: Vendor
}

// Category emoji mapping
const categoryEmojis: { [key: string]: string } = {
  'main': '🍗',
  'burger': '🍔',
  'pizza': '🍕',
  'pasta': '🍝',
  'salad': '🥗',
  'dessert': '🍰',
  'drink': '🥤',
  'appetizer': '🍟',
  'soup': '🍲',
  'seafood': '🦞',
  'chicken': '🍗',
  'beef': '🥩',
  'vegetarian': '🥬',
  'breakfast': '🍳',
  'lunch': '🍱',
  'dinner': '🍽️',
}

// Get emoji for category name
const getCategoryEmoji = (categoryName: string): string => {
  const normalized = categoryName.toLowerCase()
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (normalized.includes(key)) {
      return emoji
    }
  }
  return '🍽️' // default
}

export default function StorefrontClient({ vendor }: StorefrontClientProps) {
  const { itemCount, addItem, openDrawer } = useCartStore()
  const count = itemCount()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    vendor.categories.length > 0 ? vendor.categories[0].id : null
  )
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    rating: 5,
    comment: ''
  })
  const [reviewErrors, setReviewErrors] = useState<{ [key: string]: string }>({})
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

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

  // Get currently selected category
  const selectedCategoryData = vendor.categories.find(cat => cat.id === selectedCategory)

  // Calculate average rating
  const averageRating = vendor.reviews.length > 0
    ? vendor.reviews.reduce((sum, review) => sum + review.rating, 0) / vendor.reviews.length
    : 0

  // Format relative time
  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const reviewDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - reviewDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return reviewDate.toLocaleDateString()
  }

  // Review form validation
  const validateReviewForm = () => {
    const errors: { [key: string]: string } = {}
    
    if (!reviewForm.customerName.trim() || reviewForm.customerName.length < 2) {
      errors.customerName = 'Name must be at least 2 characters'
    }
    if (reviewForm.customerName.length > 100) {
      errors.customerName = 'Name cannot exceed 100 characters'
    }
    if (!reviewForm.comment.trim() || reviewForm.comment.length < 10) {
      errors.comment = 'Comment must be at least 10 characters'
    }
    if (reviewForm.comment.length > 500) {
      errors.comment = 'Comment cannot exceed 500 characters'
    }
    
    setReviewErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit review
  const handleSubmitReview = async () => {
    if (!validateReviewForm()) return

    setSubmittingReview(true)
    try {
      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          customerName: reviewForm.customerName.trim(),
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      setReviewSuccess(true)
      setReviewForm({ customerName: '', rating: 5, comment: '' })
      setReviewErrors({})
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setReviewErrors({ submit: 'Failed to submit review. Please try again.' })
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] pb-24">
      {/* Cover Image with Open Badge */}
      <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-amber-100 to-orange-100">
        {vendor.coverUrl ? (
          <img
            src={vendor.coverUrl}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">🍽️</div>
          </div>
        )}
        {/* Open/Closed Badge */}
        {vendor.isOnline ? (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg">
            Open
          </div>
        ) : (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">
            Closed
          </div>
        )}
      </div>

      {/* Restaurant Info Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-5 mb-5">
          {/* Restaurant Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {vendor.businessName}
          </h1>

          {/* Rating, Time, Distance Row */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5 mb-3 text-gray-700">
            {/* Rating */}
            {vendor.reviews.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span className="font-bold text-base">{averageRating.toFixed(1)}</span>
                <span className="text-gray-600 text-sm">({vendor.reviews.length} reviews)</span>
              </div>
            )}
            
            {/* Delivery Fee */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Delivery: {formatCurrency(vendor.deliveryFee)}</span>
            </div>

            {/* Address */}
            {vendor.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm">{vendor.address}</span>
              </div>
            )}
          </div>

          {/* Cuisine Tags */}
          {vendor.cuisineTags && vendor.cuisineTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {vendor.cuisineTags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {vendor.description && (
            <p className="text-gray-700 text-sm leading-relaxed mb-5">
              {vendor.description}
            </p>
          )}

          {/* Call Now Button */}
          {vendor.businessPhone && (
            <a
              href={`tel:${vendor.businessPhone}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-base font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </a>
          )}
        </div>

        {/* Offline Banner */}
        {!vendor.isOnline && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-5 rounded-lg">
            <p className="text-yellow-700 font-medium text-sm">
              This restaurant is currently closed and not accepting orders.
            </p>
          </div>
        )}

        {/* Menu Categories Section */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Menu Categories</h2>
          
          {/* Horizontal Category Tabs */}
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {vendor.categories.map((category) => {
              const emoji = getCategoryEmoji(category.name)
              const isActive = selectedCategory === category.id
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Category Menu Items */}
        {selectedCategoryData && (
          <div className="mb-8">
            {/* Category Header */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{getCategoryEmoji(selectedCategoryData.name)}</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedCategoryData.name}
                </h2>
              </div>
              {selectedCategoryData.description && (
                <p className="text-gray-600 text-sm">{selectedCategoryData.description}</p>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-3">
              {selectedCategoryData.menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex gap-3 p-3">
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 mb-0.5">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg font-bold text-orange-600">
                          {formatCurrency(item.price)}
                        </span>
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={!vendor.isOnline || !item.isAvailable}
                          size="sm"
                          className="px-3 py-1.5 text-xs"
                        >
                          {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {selectedCategoryData.menuItems.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl">
                <p className="text-gray-500 text-base">No items available in this category.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {count > 0 && (
        <button
          onClick={openDrawer}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all z-50"
          aria-label="View cart"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
            {count}
          </span>
        </button>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  )
}