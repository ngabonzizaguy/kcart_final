'use client'

import { useState, useEffect, useRef } from 'react'
import Card, { CardContent } from '@/components/ui/Card'
import Switch from '@/components/ui/Switch'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import QRCode from '@/components/ui/QRCode'
import ImageUpload from '@/components/ui/ImageUpload'
import { useToast } from '@/components/ui/Toast'
import { Download, Share2 } from 'lucide-react'

type Tab = 'info' | 'hours' | 'qr'

type DayHours = {
  open: string
  close: string
  closed: boolean
}

type BusinessHours = {
  [key: string]: DayHours
}

interface Vendor {
  id: string
  businessName: string
  businessPhone: string
  whatsappNumber: string | null
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  address: string | null
  deliveryRange: number
  isOnline: boolean
  businessHours: BusinessHours | null
  slug: string
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

const defaultBusinessHours: BusinessHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '17:00', closed: false },
  sunday: { open: '09:00', close: '17:00', closed: true }
}

export default function ProfilePage() {
  const { showToast } = useToast()
  const qrRef = useRef<HTMLDivElement>(null)

  const [selectedTab, setSelectedTab] = useState<Tab>('info')
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [businessName, setBusinessName] = useState('')
  const [businessPhone, setBusinessPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [deliveryRange, setDeliveryRange] = useState(5)
  const [isOnline, setIsOnline] = useState(true)
  const [businessHours, setBusinessHours] = useState<BusinessHours>(defaultBusinessHours)

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchVendorData()
  }, [])

  const fetchVendorData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendor/profile')
      if (!response.ok) {
        throw new Error('Failed to load profile data')
      }

      const data = await response.json()
      const vendorData = data.vendor

      setVendor(vendorData)
      setBusinessName(vendorData.businessName || '')
      setBusinessPhone(vendorData.businessPhone || '')
      setWhatsappNumber(vendorData.whatsappNumber || '')
      setDescription(vendorData.description || '')
      setLogoUrl(vendorData.logoUrl || null)
      setCoverUrl(vendorData.coverUrl || null)
      setAddress(vendorData.address || '')
      setDeliveryRange(vendorData.deliveryRange || 5)
      setIsOnline(vendorData.isOnline ?? true)
      setBusinessHours(vendorData.businessHours || defaultBusinessHours)
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to load profile'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateBusinessInfo = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    } else if (businessName.trim().length < 2) {
      newErrors.businessName = 'Name must be at least 2 characters'
    } else if (businessName.trim().length > 100) {
      newErrors.businessName = 'Name cannot exceed 100 characters'
    }

    if (!businessPhone.trim()) {
      newErrors.businessPhone = 'Business phone is required'
    } else if (businessPhone.replace(/\D/g, '').length < 10) {
      newErrors.businessPhone = 'Please enter a valid phone number'
    }

    if (whatsappNumber && whatsappNumber.replace(/\D/g, '').length < 10) {
      newErrors.whatsappNumber = 'Please enter a valid phone number'
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters'
    }

    if (address && address.length > 200) {
      newErrors.address = 'Address cannot exceed 200 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateBusinessHours = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    daysOfWeek.forEach(({ key }) => {
      const hours = businessHours[key]
      if (!hours.closed) {
        if (!hours.open || !hours.close) {
          newErrors[key] = 'Open and close times are required'
        } else if (hours.open >= hours.close) {
          newErrors[key] = 'Open time must be before close time'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleToggleOnline = async (newValue: boolean) => {
    const previousValue = isOnline
    setIsOnline(newValue)

    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newValue })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      showToast({
        type: 'success',
        message: 'Store status updated'
      })
    } catch (error: any) {
      setIsOnline(previousValue)
      showToast({
        type: 'error',
        message: error.message || 'Failed to update status'
      })
    }
  }

  const handleSaveBusinessInfo = async () => {
    if (!validateBusinessInfo()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim(),
          whatsappNumber: whatsappNumber.trim() || null,
          description: description.trim() || null,
          address: address.trim() || null,
          deliveryRange: deliveryRange
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      showToast({
        type: 'success',
        message: 'Profile updated successfully'
      })

      fetchVendorData()
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to update profile'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBusinessHours = async () => {
    if (!validateBusinessHours()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours })
      })

      if (!response.ok) {
        throw new Error('Failed to update business hours')
      }

      showToast({
        type: 'success',
        message: 'Business hours updated'
      })

      fetchVendorData()
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to update business hours'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (url: string) => {
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: url })
      })

      if (!response.ok) {
        throw new Error('Failed to save logo')
      }

      setLogoUrl(url)
      showToast({
        type: 'success',
        message: 'Logo uploaded successfully'
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to save logo'
      })
      throw error
    }
  }

  const handleLogoRemove = async () => {
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: null })
      })

      if (!response.ok) {
        throw new Error('Failed to remove logo')
      }

      setLogoUrl(null)
      showToast({
        type: 'success',
        message: 'Logo removed'
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to remove logo'
      })
      throw error
    }
  }

  const handleCoverUpload = async (url: string) => {
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: url })
      })

      if (!response.ok) {
        throw new Error('Failed to save cover image')
      }

      setCoverUrl(url)
      showToast({
        type: 'success',
        message: 'Cover image uploaded successfully'
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to save cover image'
      })
      throw error
    }
  }

  const handleCoverRemove = async () => {
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl: null })
      })

      if (!response.ok) {
        throw new Error('Failed to remove cover image')
      }

      setCoverUrl(null)
      showToast({
        type: 'success',
        message: 'Cover image removed'
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        message: error.message || 'Failed to remove cover image'
      })
      throw error
    }
  }

  const updateDayHours = (day: string, field: keyof DayHours, value: string | boolean) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
    // Clear error for this day when user makes changes
    if (errors[day]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[day]
        return newErrors
      })
    }
  }

  const handleDownloadPNG = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 300
    canvas.height = 300

    img.onload = () => {
      ctx?.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${vendor?.businessName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const handleDownloadSVG = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${vendor?.businessName.replace(/\s+/g, '-').toLowerCase()}-qr-code.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = (platform: 'whatsapp' | 'instagram' | 'tiktok') => {
    if (!vendor) return

    const storefrontUrl = `${window.location.origin}/${vendor.slug}`
    let shareUrl = ''

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent('Check out my menu: ' + storefrontUrl)}`
        break
      case 'instagram':
        shareUrl = 'https://www.instagram.com/'
        break
      case 'tiktok':
        shareUrl = 'https://www.tiktok.com/'
        break
    }

    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  const tabs = [
    { value: 'info' as Tab, label: 'Business Info' },
    { value: 'hours' as Tab, label: 'Business Hours' },
    { value: 'qr' as Tab, label: 'QR Code' }
  ]

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="p-4 md:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-medium">Failed to load profile data</p>
            <button
              onClick={fetchVendorData}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const storefrontUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${vendor.slug}`

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your business information and preferences
        </p>
      </div>

      {/* Online/Offline Toggle */}
      <Card className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-1">Store Status</p>
              <p className={`text-sm font-medium ${isOnline ? 'text-status-success' : 'text-primary-500'}`}>
                {isOnline ? 'Your store is online' : 'Your store is offline'}
              </p>
            </div>
            <div className={isOnline ? '[&_button]:bg-green-500 [&_button]:shadow-[0_0_15px_rgba(76,175,80,0.5)]' : '[&_button]:bg-orange-500 [&_button]:shadow-[0_0_15px_rgba(255,127,42,0.5)]'}>
              <Switch
                checked={isOnline}
                onChange={handleToggleOnline}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSelectedTab(tab.value)}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              selectedTab === tab.value
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="bg-white/60 backdrop-blur-lg border border-white/20 rounded-2xl">
        <CardContent className="pt-6">
          {/* Business Info Tab */}
          {selectedTab === 'info' && (
            <div className="space-y-6">
              <ImageUpload
                label="Business Logo"
                folder="logos"
                currentImage={logoUrl}
                aspectRatio="square"
                maxSizeMB={2}
                onUploadComplete={handleLogoUpload}
                onRemove={handleLogoRemove}
              />

              <ImageUpload
                label="Cover Image"
                folder="covers"
                currentImage={coverUrl}
                aspectRatio="cover"
                maxSizeMB={5}
                onUploadComplete={handleCoverUpload}
                onRemove={handleCoverRemove}
              />

              <Input
                label="Business Name"
                value={businessName}
                onChange={e => {
                  setBusinessName(e.target.value)
                  if (errors.businessName) {
                    setErrors(prev => ({ ...prev, businessName: '' }))
                  }
                }}
                error={errors.businessName}
                required
              />

              <Input
                label="Business Phone"
                type="tel"
                value={businessPhone}
                onChange={e => {
                  setBusinessPhone(e.target.value)
                  if (errors.businessPhone) {
                    setErrors(prev => ({ ...prev, businessPhone: '' }))
                  }
                }}
                error={errors.businessPhone}
                required
              />

              <Input
                label="WhatsApp Number"
                type="tel"
                value={whatsappNumber}
                onChange={e => {
                  setWhatsappNumber(e.target.value)
                  if (errors.whatsappNumber) {
                    setErrors(prev => ({ ...prev, whatsappNumber: '' }))
                  }
                }}
                error={errors.whatsappNumber}
                helperText="Optional - if different from business phone"
              />

              <Input
                label="Business Address"
                type="text"
                value={address}
                onChange={e => {
                  setAddress(e.target.value)
                  if (errors.address) {
                    setErrors(prev => ({ ...prev, address: '' }))
                  }
                }}
                error={errors.address}
                placeholder="e.g., KG 123 St, Kigali"
                helperText="Your business location for customer reference"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-3">
                  Delivery Range: <span className="text-primary-600 font-bold text-lg">{deliveryRange} km</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={deliveryRange}
                    onChange={e => setDeliveryRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    style={{
                      background: `linear-gradient(to right, #fb923c 0%, #f97316 ${((deliveryRange - 2) / 18) * 100}%, #e5e7eb ${((deliveryRange - 2) / 18) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>2km</span>
                    <span>5km</span>
                    <span>10km</span>
                    <span>15km</span>
                    <span>20km</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value)
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }))
                    }
                  }}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="Tell customers about your business..."
                />
                {errors.description && (
                  <p className="text-sm text-status-error mt-1">{errors.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              <Button
                onClick={handleSaveBusinessInfo}
                loading={isSaving}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                Save Changes
              </Button>
            </div>
          )}

          {/* Business Hours Tab */}
          {selectedTab === 'hours' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {daysOfWeek.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center w-full md:w-32">
                        <input
                          type="checkbox"
                          id={`day-${key}`}
                          checked={!businessHours[key].closed}
                          onChange={e => updateDayHours(key, 'closed', !e.target.checked)}
                          className="mr-2 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor={`day-${key}`} className="font-semibold text-gray-900">
                          {label}
                        </label>
                      </div>

                      {!businessHours[key].closed ? (
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="time"
                            value={businessHours[key].open}
                            onChange={e => updateDayHours(key, 'open', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={businessHours[key].close}
                            onChange={e => updateDayHours(key, 'close', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Closed</span>
                      )}
                    </div>
                    {errors[key] && (
                      <p className="text-sm text-status-error ml-36">{errors[key]}</p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveBusinessHours}
                loading={isSaving}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                Save Business Hours
              </Button>
            </div>
          )}

          {/* QR Code Tab */}
          {selectedTab === 'qr' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your Storefront QR Code
                </h2>
                <p className="text-gray-600 text-sm">
                  Customers can scan this to access your menu
                </p>
              </div>

              {/* QR Code Display */}
              <div ref={qrRef} className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-lg border-4 border-white shadow-2xl rounded-2xl p-6">
                  <QRCode value={storefrontUrl} size={256} />
                </div>
              </div>

              {/* Storefront URL */}
              <div className="bg-gray-100 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Storefront URL</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {storefrontUrl}
                </p>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleDownloadPNG}
                  variant="primary"
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={handleDownloadSVG}
                  variant="primary"
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-medium text-gray-700 text-center mb-4">
                  Share on Social Media
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25d366] text-white font-medium hover:bg-[#20ba5a] transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('instagram')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E4405F] text-white font-medium hover:bg-[#d12d4a] transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    Instagram
                  </button>
                  <button
                    onClick={() => handleShare('tiktok')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#000000] text-white font-medium hover:bg-[#2d2d2d] transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    TikTok
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}