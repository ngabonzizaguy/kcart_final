'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function LocationPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState('')
  const [addressRw, setAddressRw] = useState('')
  const [deliveryRange, setDeliveryRange] = useState(5)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || address.length < 3) {
      showToast({
        type: 'error',
        message: 'Address is required',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/vendor/onboarding/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          addressRw: addressRw || undefined,
          deliveryRange,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save location')
      }

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
          Where is your business located?
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <Input
          label="Business Address"
          type="text"
          placeholder="e.g., KN 5 Rd, Kigali"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <Input
          label="Address (Kinyarwanda)"
          type="text"
          placeholder="Optional"
          value={addressRw}
          onChange={(e) => setAddressRw(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Range: {deliveryRange} km
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={deliveryRange}
            onChange={(e) => setDeliveryRange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>

        {/* REMOVED: Latitude and Longitude inputs */}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/onboarding/media')}
            fullWidth
          >
            Back
          </Button>
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