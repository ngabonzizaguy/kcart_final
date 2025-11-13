'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  orderData: {
    total: number
    paymentMethod: string
    orderNumber?: string
  }
  isLoading?: boolean
}

export default function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  isLoading = false
}: PaymentConfirmationModalProps) {
  const [selectedOption, setSelectedOption] = useState<'delivered' | 'not_delivered' | null>(null)

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption === 'delivered')
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Cash on Delivery'
      case 'mtn_momo':
        return 'MTN Mobile Money'
      case 'airtel_money':
        return 'Airtel Money'
      default:
        return method
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Header with Security Icon */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                🔒 Payment Security Notice
              </h2>
              <p className="text-blue-100 text-sm mt-0.5">
                Your payment is protected by DeliGo
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Secure Payment Processing
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Before continuing with payment, please note that your funds will be securely held by DeliGo until your order is safely delivered.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>

            {orderData.orderNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium text-gray-900">#{orderData.orderNumber}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium text-gray-900">
                {getPaymentMethodLabel(orderData.paymentMethod)}
              </span>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatCurrency(orderData.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Confirmation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Delivery Status</h3>
            <p className="text-sm text-gray-600">
              Please confirm your delivery status to proceed with payment processing:
            </p>

            <div className="space-y-3">
              {/* Delivered Option */}
              <button
                onClick={() => setSelectedOption('delivered')}
                disabled={isLoading}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOption === 'delivered'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedOption === 'delivered' ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      selectedOption === 'delivered' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Order Delivered ✅
                    </div>
                    <div className="text-sm text-gray-600">
                      I have received my order. Release payment to vendor.
                    </div>
                  </div>
                </div>
              </button>

              {/* Not Delivered Option */}
              <button
                onClick={() => setSelectedOption('not_delivered')}
                disabled={isLoading}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOption === 'not_delivered'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedOption === 'not_delivered' ? 'bg-red-500' : 'bg-gray-100'
                  }`}>
                    <XCircle className={`w-5 h-5 ${
                      selectedOption === 'not_delivered' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">
                      Not Delivered ❌
                    </div>
                    <div className="text-sm text-gray-600">
                      I have not received my order. Report delivery issue.
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {selectedOption === 'not_delivered' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    Our team will review your report and contact you about the delivery issue.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedOption || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : 'Confirm & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}