'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessInfoSchema, type BusinessInfoInput } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'bar', label: 'Bar' },
  { value: 'other', label: 'Other' },
]

const cuisineTagSuggestions = [
  'International',
  'Local Dishes',
  'Grilled',
  'Fast Food',
  'Vegetarian',
  'Seafood',
  'Street Food',
  'Traditional',
  'Modern Cuisine',
  'Healthy Options',
  'Breakfast',
  'Lunch Specials',
  'Dinner',
  'Snacks',
  'Beverages'
]

export default function BusinessInfoPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cuisineTags, setCuisineTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessInfoInput>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessType: 'restaurant',
    },
  })

  useEffect(() => {
    const loadUserMetadata = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error fetching user:', error)
          return
        }
        
        // Extract business_name from user metadata
        const businessNameFromSignup = user?.user_metadata?.business_name
        
        if (businessNameFromSignup) {
          // Prefill the business name field using react-hook-form's reset
          reset({
            businessName: businessNameFromSignup,
            businessType: 'restaurant', // Keep default
          })
        }
      } catch (error) {
        console.error('Error loading user metadata:', error)
      }
    }
    
    loadUserMetadata()
  }, [reset])

  const handleToggleTag = (tag: string) => {
    if (cuisineTags.includes(tag)) {
      setCuisineTags(cuisineTags.filter(t => t !== tag))
    } else {
      if (cuisineTags.length >= 5) {
        showToast({
          type: 'error',
          message: 'Maximum 5 tags allowed'
        })
        return
      }
      setCuisineTags([...cuisineTags, tag])
    }
  }

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim()
    
    if (!trimmedTag) return
    
    if (cuisineTags.length >= 5) {
      showToast({
        type: 'error',
        message: 'Maximum 5 tags allowed'
      })
      return
    }
    
    if (cuisineTags.includes(trimmedTag)) {
      showToast({
        type: 'error',
        message: 'Tag already added'
      })
      return
    }
    
    if (trimmedTag.length > 30) {
      showToast({
        type: 'error',
        message: 'Tag must be 30 characters or less'
      })
      return
    }
    
    setCuisineTags([...cuisineTags, trimmedTag])
    setCustomTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setCuisineTags(cuisineTags.filter(t => t !== tag))
  }

  const onSubmit = async (data: BusinessInfoInput) => {
    setLoading(true)
    try {
      const response = await fetch('/api/vendor/onboarding/business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cuisineTags: cuisineTags
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save business info')
      }

      showToast({
        type: 'success',
        message: 'Business info saved!',
      })

      router.push('/onboarding/media')
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-orange bg-clip-text text-transparent mb-2">
            DeliGo
          </h1>
          <div className="text-sm text-gray-500 mb-4">Step 1 of 4</div>
        </div>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Tell us about your business to get started
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <Input
          label="Business Name"
          placeholder="My Restaurant"
          {...register('businessName')}
          error={errors.businessName?.message}
          required
        />

        <Select
          label="Business Type"
          options={businessTypes}
          {...register('businessType')}
          error={errors.businessType?.message}
          required
        />

        <TextArea
          label="Description"
          placeholder="Tell customers about your business..."
          rows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Cuisine Tags Section */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cuisine Tags (Optional)
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Help customers find you. Select up to 5 tags that describe your cuisine.
            </p>
          </div>
          
          {/* Tag Suggestions */}
          <div className="flex flex-wrap gap-2">
            {cuisineTagSuggestions.map((tag) => {
              const isSelected = cuisineTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          
          {/* Selected Tags Display */}
          {cuisineTags.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-medium text-amber-800 mb-2">
                Selected Tags ({cuisineTags.length}/5):
              </p>
              <div className="flex flex-wrap gap-2">
                {cuisineTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-800 text-sm font-medium rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Tag Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Add Custom Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                placeholder="e.g., Organic Food"
                maxLength={30}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTag.trim() || cuisineTags.length >= 5}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Continue
          </Button>
        </div>
      </form>
    </Card>
  )
}