'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react'
import Button from '@/components/ui/Button'

interface PaymentSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  vendorId?: string
}

export default function PaymentSettingsModal({ isOpen, onClose, vendorId }: PaymentSettingsModalProps) {
  const [paymentMethods, setPaymentMethods] = useState({
    cashOnDelivery: true,
    cardPayment: false,
    onlinePayment: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current payment settings
  useEffect(() => {
    if (isOpen) {
      fetchPaymentSettings()
    }
  }, [isOpen])

  const fetchPaymentSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/vendor/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch payment settings')
      }
      const data = await response.json()

      // Update payment methods from profile data
      if (data.vendor?.paymentMethods) {
        setPaymentMethods(data.vendor.paymentMethods)
      }
    } catch (error) {
      console.error('Fetch payment settings error:', error)
      setError('Failed to load payment settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethods })
      })

      if (!response.ok) {
        throw new Error('Failed to save payment settings')
      }

      // Close modal on success
      onClose()
    } catch (error) {
      console.error('Save payment settings error:', error)
      setError('Failed to save payment settings. Please try again.')
    } finally {
      setIsSaving(false)
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
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Select the payment methods you accept from customers
                </p>

                {/* Cash on Delivery */}
                <label className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 cursor-pointer hover:border-orange-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={paymentMethods.cashOnDelivery}
                    onChange={(e) =>
                      setPaymentMethods(prev => ({
                        ...prev,
                        cashOnDelivery: e.target.checked
                      }))
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <Banknote className="w-6 h-6 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-600">Customer pays with cash when order arrives</p>
                  </div>
                </label>

                {/* Card Payment */}
                <label className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 cursor-pointer hover:border-orange-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={paymentMethods.cardPayment}
                    onChange={(e) =>
                      setPaymentMethods(prev => ({
                        ...prev,
                        cardPayment: e.target.checked
                      }))
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <CreditCard className="w-6 h-6 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Card Payment</p>
                    <p className="text-xs text-gray-600">Accept credit/debit card payments</p>
                  </div>
                </label>

                {/* Online Payment */}
                <label className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 cursor-pointer hover:border-orange-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={paymentMethods.onlinePayment}
                    onChange={(e) =>
                      setPaymentMethods(prev => ({
                        ...prev,
                        onlinePayment: e.target.checked
                      }))
                    }
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <Smartphone className="w-6 h-6 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-600">Mobile money and digital wallets</p>
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}