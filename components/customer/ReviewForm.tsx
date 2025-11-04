'use client'

import { useState } from 'react'
import { Star, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import { useToast } from '@/components/ui/Toast'

interface ReviewFormProps {
  vendorId: string
  orderNumber: string
  onSuccess?: () => void
}

export default function ReviewForm({ vendorId, orderNumber, onSuccess }: ReviewFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    customerName: '',
    rating: 5,
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.customerName.trim() || formData.customerName.length < 2) {
      newErrors.customerName = 'Name must be at least 2 characters'
    }
    if (formData.customerName.length > 100) {
      newErrors.customerName = 'Name cannot exceed 100 characters'
    }
    if (!formData.comment.trim() || formData.comment.length < 10) {
      newErrors.comment = 'Comment must be at least 10 characters'
    }
    if (formData.comment.length > 500) {
      newErrors.comment = 'Comment cannot exceed 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/customer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          customerName: formData.customerName.trim(),
          rating: formData.rating,
          comment: formData.comment.trim(),
          orderNumber
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit review')
      }

      showToast({
        type: 'success',
        message: 'Review submitted successfully! Thank you for your feedback.',
      })

      // Reset form
      setFormData({
        customerName: '',
        rating: 5,
        comment: ''
      })
      setErrors({})

      // Call success callback
      onSuccess?.()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Review Failed',
        message: error.message || 'Failed to submit review. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Name
        </label>
        <Input
          value={formData.customerName}
          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          placeholder="Enter your name"
          error={errors.customerName}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              disabled={isSubmitting}
              className="p-1 transition-colors"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= formData.rating
                    ? 'fill-orange-500 text-orange-500'
                    : 'fill-gray-200 text-gray-300'
                } ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:text-orange-400'} transition-colors`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {formData.rating} {formData.rating === 1 ? 'star' : 'stars'}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review
        </label>
        <TextArea
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Share your experience with this order..."
          error={errors.comment}
          rows={4}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.comment.length}/500 characters
        </p>
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting}
        loading={isSubmitting}
        className="flex items-center gap-2"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}