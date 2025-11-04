'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { useToast } from '@/components/ui/Toast'
import CheckoutForm from '@/components/customer/CheckoutForm'

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const { items, vendorId, vendorSlug, deliveryFee, subtotal, acceptedPaymentMethods } = useCartStore()

  const slug = params.slug as string
  const cartSubtotal = subtotal()

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0) {
      showToast({
        type: 'error',
        message: 'Your cart is empty',
      })
      router.push(`/${slug}`)
      return
    }

    // Redirect if vendor slug doesn't match
    if (vendorSlug && vendorSlug !== slug) {
      showToast({
        type: 'error',
        message: 'Cart vendor mismatch',
      })
      router.push(`/${vendorSlug}`)
      return
    }
  }, [items, vendorSlug, slug, router, showToast])

  // Fetch vendor data to get accepted payment methods
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!slug) return
      
      try {
        setIsLoadingVendor(true)
        const response = await fetch(`/api/vendors/${slug}`)
        
        if (response.ok) {
          const data = await response.json()
          setAcceptedPaymentMethods(data.vendor?.acceptedPaymentMethods || ['cash_on_delivery'])
        }
      } catch (error) {
        console.error('Failed to fetch vendor data:', error)
        // Use default if fetch fails
        setAcceptedPaymentMethods(['cash_on_delivery'])
      } finally {
        setIsLoadingVendor(false)
      }
    }

    fetchVendorData()
  }, [slug])

  // Don't render if cart is empty or vendor mismatch
  if (items.length === 0 || !vendorId || !vendorSlug) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Show loading while fetching vendor data
  if (isLoadingVendor) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <CheckoutForm
          vendorId={vendorId}
          vendorSlug={vendorSlug}
          deliveryFee={deliveryFee}
          acceptedPaymentMethods={acceptedPaymentMethods}
          cartItems={items}
          subtotal={cartSubtotal}
        />
      </div>
    </div>
  )
}