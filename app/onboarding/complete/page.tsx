'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import QRCode from '@/components/ui/QRCode'
import { useToast } from '@/components/ui/Toast'

export default function CompletePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [storefrontUrl, setStorefrontUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendorData()
  }, [])

  const fetchVendorData = async () => {
    try {
      const response = await fetch('/api/vendor/profile')
      if (!response.ok) throw new Error('Failed to fetch vendor data')

      const { vendor } = await response.json()
      setSlug(vendor.slug)
      const url = `${window.location.origin}/${vendor.slug}`
      setStorefrontUrl(url)
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to load storefront details',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl)
      setCopied(true)
      showToast({
        type: 'success',
        message: 'Link copied!',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to copy link',
      })
    }
  }

  const handleViewStorefront = () => {
    window.open(storefrontUrl, '_blank')
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-orange bg-clip-text text-transparent mb-2">
            You're all set!
          </h1>
        </div>
        <CardTitle className="text-center">Your Storefront is Ready</CardTitle>
        <CardDescription className="text-center">
          Share your link or QR code with customers
        </CardDescription>
      </CardHeader>

      <div className="space-y-6 mt-6">
        {/* QR Code */}
        <div className="flex justify-center py-6 bg-gray-50 rounded-xl">
          {storefrontUrl && <QRCode value={storefrontUrl} size={200} />}
        </div>

        {/* Storefront Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Storefront URL
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 overflow-x-auto">
              {storefrontUrl}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            type="button"
            fullWidth
            onClick={handleViewStorefront}
            className="flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Your Storefront
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Next Steps */}
        <div className="bg-primary-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Add categories and menu items in your dashboard</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Toggle your business online when ready to accept orders</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>Share your storefront link or QR code with customers</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
