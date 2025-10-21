'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
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
  reviews: Review[]
}

interface StorefrontClientProps {
  vendor: Vendor
}

export default function StorefrontClient({ vendor }: StorefrontClientProps) {
  const { itemCount, addItem, openDrawer } = useCartStore()
  const count = itemCount()
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
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

  // Filter menu items by selected category
  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return vendor.categories.flatMap(cat => 
        cat.menuItems.map(item => ({ ...item, categoryName: cat.name }))
      )
    }
    const category = vendor.categories.find(cat => cat.id === selectedCategory)
    return category ? category.menuItems.map(item => ({ ...item, categoryName: category.name })) : []
  }

  const filteredItems = getFilteredItems()

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

      // Show success and reset form
      setReviewSuccess(true)
      setReviewForm({ customerName: '', rating: 5, comment: '' })
      setReviewErrors({})
      
      // Reload page to show new review
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

        {/* Horizontal Category Tabs */}
        <div className="flex overflow-x-auto gap-2 px-0 py-3 bg-white/60 backdrop-blur-lg border-b border-white/20 rounded-2xl mb-6 scrollbar-hide">
          <div className="flex gap-2 px-4 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                  : 'bg-white/80 border border-orange-200 text-orange-600 hover:bg-orange-50'
              }`}
            >
              🍽️ All Items
            </button>
            {vendor.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                    : 'bg-white/80 border border-orange-200 text-orange-600 hover:bg-orange-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items - Stacked Cards */}
        <div className="space-y-3 mb-12">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-orange-200 to-orange-300 flex-shrink-0 flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-gray-800 mb-1 truncate">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-orange-600 font-bold text-base">
                      {formatCurrency(item.price)}
                    </span>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      disabled={!vendor.isOnline || !item.isAvailable}
                      size="sm"
                      className="px-3 py-1.5 text-sm"
                    >
                      {item.isAvailable ? 'Add' : 'Unavailable'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 mb-12">
            <p className="text-gray-500 text-lg">No menu items available in this category.</p>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {vendor.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-orange-600">
                  {averageRating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? 'fill-orange-500 text-orange-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({vendor.reviews.length} reviews)</span>
              </div>
            )}
          </div>

          {/* Review Submission Form */}
          <div className="bg-orange-50/80 backdrop-blur-lg border-2 border-orange-200 rounded-2xl p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Write a Review</h3>
            {reviewSuccess && (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">
                Review submitted successfully! Thank you for your feedback.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={reviewForm.customerName}
                  onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="John Doe"
                  maxLength={100}
                />
                {reviewErrors.customerName && (
                  <p className="text-sm text-red-600 mt-1">{reviewErrors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          star <= reviewForm.rating
                            ? 'fill-orange-500 text-orange-500'
                            : 'text-gray-300 hover:text-orange-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="Share your experience..."
                  maxLength={500}
                />
                {reviewErrors.comment && (
                  <p className="text-sm text-red-600 mt-1">{reviewErrors.comment}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {reviewForm.comment.length}/500 characters
                </p>
              </div>

              {reviewErrors.submit && (
                <p className="text-sm text-red-600">{reviewErrors.submit}</p>
              )}

              <Button
                onClick={handleSubmitReview}
                loading={submittingReview}
                disabled={submittingReview}
                className="w-full"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>

          {/* Reviews List */}
          {vendor.reviews.length > 0 ? (
            <div className="space-y-4">
              {vendor.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{review.customerName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-orange-500 text-orange-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white/60 backdrop-blur-lg rounded-2xl">
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Call Button */}
      {vendor.businessPhone && (
        <a
          href={`tel:${vendor.businessPhone}`}
          className="fixed bottom-20 left-4 md:bottom-6 md:left-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center z-40"
          aria-label="Call vendor"
        >
          <Phone className="w-6 h-6" />
        </a>
      )}

      {/* Floating Cart Button */}
      {count > 0 && (
        <button
          onClick={openDrawer}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-primary-500 text-white rounded-full p-4 shadow-2xl hover:bg-primary-600 transition-all hover:scale-110 z-30"
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