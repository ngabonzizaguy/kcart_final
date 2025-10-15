'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

type DayHours = {
  open: string
  close: string
  closed: boolean
}

type BusinessHours = {
  [key: string]: DayHours
}

export default function ContactPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [businessPhone, setBusinessPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '09:00', close: '17:00', closed: true },
  })

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessPhone || businessPhone.length < 10) {
      showToast({
        type: 'error',
        message: 'Valid phone number required',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/vendor/onboarding/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessPhone,
          whatsappNumber: whatsappNumber || undefined,
          businessHours,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save contact info')
      }

      showToast({
        type: 'success',
        message: 'Setup complete!',
      })

      router.push('/onboarding/complete')
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
          <div className="text-sm text-gray-500 mb-4">Step 4 of 4</div>
        </div>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          How can customers reach you?
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        <Input
          label="Business Phone"
          type="tel"
          placeholder="+250 XXX XXX XXX"
          value={businessPhone}
          onChange={(e) => setBusinessPhone(e.target.value)}
          required
        />

        <Input
          label="WhatsApp Number"
          type="tel"
          placeholder="Optional - if different from business phone"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Business Hours
          </label>
          <div className="space-y-3">
            {daysOfWeek.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-24">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!businessHours[key].closed}
                      onChange={(e) =>
                        updateDayHours(key, 'closed', !e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                </div>
                {!businessHours[key].closed ? (
                  <>
                    <input
                      type="time"
                      value={businessHours[key].open}
                      onChange={(e) => updateDayHours(key, 'open', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={businessHours[key].close}
                      onChange={(e) => updateDayHours(key, 'close', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </>
                ) : (
                  <span className="text-sm text-gray-500">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Complete Setup
          </Button>
        </div>
      </form>
    </Card>
  )
}
