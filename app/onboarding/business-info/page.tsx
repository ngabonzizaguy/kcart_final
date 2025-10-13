'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessInfoSchema, type BusinessInfoInput } from '@/lib/validations'
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

export default function BusinessInfoPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInfoInput>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessType: 'restaurant',
    },
  })

  const onSubmit = async (data: BusinessInfoInput) => {
    setLoading(true)
    try {
      const response = await fetch('/api/vendor/onboarding/business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

        <Input
          label="Business Name (Kinyarwanda)"
          placeholder="Optional"
          {...register('businessNameRw')}
          error={errors.businessNameRw?.message}
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

        <TextArea
          label="Description (Kinyarwanda)"
          placeholder="Optional"
          rows={4}
          {...register('descriptionRw')}
          error={errors.descriptionRw?.message}
        />

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
