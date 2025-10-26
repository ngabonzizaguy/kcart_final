'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Switch from '@/components/ui/Switch'

interface PaymentSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  vendorId?: string
}

export default function PaymentSettingsModal({ isOpen, onClose, vendorId }: PaymentSettingsModalProps) {
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<string[]>(['cash_on_delivery'])
  const [businessPhone, setBusinessPhone] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch current payment settings
  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings()
    }
  }, [isOpen])

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchPaymentSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vendor/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch payment settings')
      }
      const data = await response.json()

      // Update payment methods from profile data (using NEW schema)
      if (data.vendor?.acceptedPaymentMethods) {
        setAcceptedPaymentMethods(data.vendor.acceptedPaymentMethods)
      } else {
        // Default to cash on delivery if no payment methods set
        setAcceptedPaymentMethods(['cash_on_delivery'])
      }

      // Update business phone (used for mobile money payments)
      if (data.vendor?.businessPhone) {
        setBusinessPhone(data.vendor.businessPhone)
      }
    } catch (error) {
      console.error('Fetch payment settings error:', error)
      setToast({ type: 'error', message: 'Failed to load payment settings' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePaymentMethod = async (method: string, enabled: boolean) => {
    const previousValue = acceptedPaymentMethods
    let newMethods: string[]

    if (enabled) {
      newMethods = [...acceptedPaymentMethods, method]
    } else {
      newMethods = acceptedPaymentMethods.filter(m => m !== method)
    }

    // Validation: At least one payment method must be enabled
    if (newMethods.length === 0) {
      setToast({
        type: 'error',
        message: 'At least one payment method must be enabled'
      })
      return
    }

    // Optimistic update
    setAcceptedPaymentMethods(newMethods)

    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedPaymentMethods: newMethods })
      })

      if (!response.ok) {
        throw new Error('Failed to update payment methods')
      }

      setToast({
        type: 'success',
        message: 'Payment methods updated'
      })
    } catch (error) {
      // Revert on error
      setAcceptedPaymentMethods(previousValue)
      setToast({
        type: 'error',
        message: 'Failed to update payment methods'
      })
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which payment methods you accept. Changes are saved automatically.
                </p>

                {/* Payment Phone Number (from onboarding) */}
                <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📱</span>
                    <p className="text-sm font-semibold text-gray-900">Payment Phone Number</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm border border-orange-200/50 rounded-lg px-3 py-2 mb-2">
                    <p className="text-base font-mono text-gray-900">{businessPhone || 'Not set'}</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    🔒 This is your business phone from onboarding. Mobile money payments will use this number.
                  </p>
                </div>

                {/* Toast Notification */}
                {toast && (
                  <div className={`p-3 rounded-lg border ${
                    toast.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-sm font-medium">{toast.message}</p>
                  </div>
                )}

                {/* Payment Method Toggles */}
                <div className="space-y-4">
                  {/* Cash on Delivery */}
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-amber-200/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                        💵
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Customer pays when order arrives</p>
                      </div>
                    </div>
                    <Switch
                      checked={acceptedPaymentMethods.includes('cash_on_delivery')}
                      onChange={(value) => handleTogglePaymentMethod('cash_on_delivery', value)}
                    />
                  </div>

                  {/* MTN Mobile Money */}
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-amber-200/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">MTN Mobile Money</p>
                        <p className="text-sm text-gray-600">MTN MoMo payment</p>
                      </div>
                    </div>
                    <Switch
                      checked={acceptedPaymentMethods.includes('mtn_mobile_money')}
                      onChange={(value) => handleTogglePaymentMethod('mtn_mobile_money', value)}
                    />
                  </div>

                  {/* Airtel Money */}
                  <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border border-amber-200/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-xl flex items-center justify-center text-2xl">
                        📱
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Airtel Money</p>
                        <p className="text-sm text-gray-600">Airtel Money payment</p>
                      </div>
                    </div>
                    <Switch
                      checked={acceptedPaymentMethods.includes('airtel_mobile_money')}
                      onChange={(value) => handleTogglePaymentMethod('airtel_mobile_money', value)}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Note:</span> At least one payment method must be enabled. Changes are saved automatically.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}