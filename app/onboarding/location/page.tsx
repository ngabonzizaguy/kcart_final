'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessLocationSchema, type BusinessLocationInput } from '@/lib/validations'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function LocationPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessLocationInput>({
    resolver: zodResolver(businessLocationSchema),
    defaultValues: {
      deliveryRange: 5,
    },
  })

  const onSubmit = async (data: BusinessLocationInput) => {
    setLoading(true)
    try {
      const response = await fetch('/api/vendor/onboarding/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save location')
      }

      showToast({
        type: 'success',
        message: 'Location saved!',
      })

      router.push('/onboarding/contact')
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
          <div className="text-sm text-gray-500 mb-4">Step 3 of 4</div>
        </div>
        <CardTitle>Location & Delivery</CardTitle>
        <CardDescription>
          Where are you located and how far do you deliver?
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <TextArea
          label="Address"
          placeholder="Street address, city, district..."
          rows={3}
          {...register('address')}
          error={errors.address?.message}
          required
        />

        <TextArea
          label="Address (Kinyarwanda)"
          placeholder="Optional"
          rows={3}
          {...register('addressRw')}
          error={errors.addressRw?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="Optional"
            {...register('latitude', { valueAsNumber: true })}
            error={errors.latitude?.message}
          />

          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="Optional"
            {...register('longitude', { valueAsNumber: true })}
            error={errors.longitude?.message}
          />
        </div>

        <Input
          label="Delivery Range (km)"
          type="number"
          min="1"
          max="50"
          {...register('deliveryRange', { valueAsNumber: true })}
          error={errors.deliveryRange?.message}
          required
          helperText="How far from your location do you deliver?"
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
