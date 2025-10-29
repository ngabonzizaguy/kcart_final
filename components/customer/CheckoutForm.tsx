'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import TextArea from '@/components/ui/TextArea'
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

// Validation schema
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerPhone: z.string().min(10, 'Valid phone number required'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  deliveryType: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'mtn_mobile_money', 'airtel_mobile_money']),
}).refine((data) => {
  // If delivery type is delivery, address is required
  if (data.deliveryType === 'delivery' && !data.deliveryAddress) {
    return false
  }
  return true
}, {
  message: 'Delivery address is required for delivery orders',
  path: ['deliveryAddress'],
})

type CheckoutFormData = z.infer<typeof checkoutFormSchema>

interface CheckoutFormProps {
  vendorId: string
  vendorSlug: string
  deliveryFee: number
  acceptedPaymentMethods: string[]
  cartItems: Array<{
    menuItemId: string
    name: string
    nameRw: string | null
    price: number
    quantity: number
    imageUrl: string | null
  }>
  subtotal: number
}

export default function CheckoutForm({
  vendorId,
  vendorSlug,
  deliveryFee,
  acceptedPaymentMethods,
  cartItems,
  subtotal,
}: CheckoutFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const { clearCart } = useCartStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryType: 'delivery',
      paymentMethod: acceptedPaymentMethods[0] as any,
    },
  })

  const deliveryType = watch('deliveryType')
  const calculatedDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0
  const total = subtotal + calculatedDeliveryFee

  // Load customer info from localStorage on mount
  useEffect(() => {
    const loadCustomerInfo = () => {
      if (typeof window === 'undefined') return

      try {
        const stored = localStorage.getItem('deligo-customer-info')
        if (stored) {
          const customerInfo = JSON.parse(stored)
          if (customerInfo.customerName) {
            setValue('customerName', customerInfo.customerName)
          }
          if (customerInfo.customerPhone) {
            setValue('customerPhone', customerInfo.customerPhone)
          }
          if (customerInfo.customerEmail) {
            setValue('customerEmail', customerInfo.customerEmail)
          }
        }
      } catch (error) {
        console.error('Failed to load customer info from localStorage:', error)
        // Clear corrupted data
        localStorage.removeItem('deligo-customer-info')
      }
    }

    loadCustomerInfo()
  }, [setValue])

  // Save customer info to localStorage when fields change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'customerName' || name === 'customerPhone' || name === 'customerEmail') {
        if (typeof window === 'undefined') return

        try {
          const customerInfo = {
            customerName: value.customerName || '',
            customerPhone: value.customerPhone || '',
            customerEmail: value.customerEmail || '',
            lastUpdated: new Date().toISOString(),
          }
          localStorage.setItem('deligo-customer-info', JSON.stringify(customerInfo))
        } catch (error) {
          console.error('Failed to save customer info to localStorage:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CheckoutFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['customerName', 'customerPhone', 'customerEmail']
    } else if (currentStep === 2) {
      if (deliveryType === 'delivery') {
        fieldsToValidate = ['deliveryType', 'deliveryAddress', 'deliveryNotes']
      } else {
        fieldsToValidate = ['deliveryType']
      }
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)
    try {
      // Create order
      const orderData = {
        vendorId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        deliveryType: data.deliveryType,
        deliveryAddress: data.deliveryAddress || undefined,
        deliveryNotes: data.deliveryNotes || undefined,
        paymentMethod: data.paymentMethod,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        deliveryFee: calculatedDeliveryFee,
        total,
      }

      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }

      const { order } = await response.json()

      // Save recent order info for cart drawer success message
      try {
        const recentOrder = {
          orderNumber: order.orderNumber,
          timestamp: Date.now(),
          vendorSlug: vendorSlug,
        }
        localStorage.setItem('deligo-recent-order', JSON.stringify(recentOrder))
      } catch (error) {
        console.error('Failed to save recent order to localStorage:', error)
      }

      // Clear cart and navigate to storefront with success banner
      clearCart()
      showToast({
        type: 'success',
        message: 'Order placed successfully!',
      })
      router.push(`/${vendorSlug}?orderPlaced=true&orderNumber=${order.orderNumber}`)
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Order Failed',
        message: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
              'flex items-center',
              step < 3 && 'flex-1'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                currentStep >= step
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              )}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={cn(
                  'h-1 flex-1 mx-2 rounded transition-all',
                  currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Customer Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Who should we deliver to?</CardDescription>
          </CardHeader>
          <div className="space-y-4 mt-4">
            <Input
              label="Full Name"
              {...register('customerName')}
              error={errors.customerName?.message}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g., 078XXXXXXX"
              {...register('customerPhone')}
              error={errors.customerPhone?.message}
              required
            />
            <Input
              label="Email (Optional)"
              type="email"
              placeholder="your@email.com"
              {...register('customerEmail')}
              error={errors.customerEmail?.message}
            />
          </div>
          <div className="mt-6">
            <Button
              type="button"
              onClick={handleNextStep}
              fullWidth
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Delivery Details */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
            <CardDescription>How would you like to receive your order?</CardDescription>
          </CardHeader>
          <div className="space-y-4 mt-4">
            {/* Delivery Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  'relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all',
                  deliveryType === 'delivery'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    {...register('deliveryType')}
                    value="delivery"
                    className="sr-only"
                  />
                  <span className="font-medium">Delivery</span>
                </label>
                <label className={cn(
                  'relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all',
                  deliveryType === 'pickup'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    {...register('deliveryType')}
                    value="pickup"
                    className="sr-only"
                  />
                  <span className="font-medium">Pickup</span>
                </label>
              </div>
            </div>

            {/* Delivery Address (only if delivery selected) */}
            {deliveryType === 'delivery' && (
              <Input
                label="Delivery Address"
                placeholder="e.g., KN 5 Rd, Kigali"
                {...register('deliveryAddress')}
                error={errors.deliveryAddress?.message}
                required
              />
            )}

            {/* Delivery Notes */}
            <TextArea
              label="Delivery Notes (Optional)"
              placeholder="Any special instructions?"
              {...register('deliveryNotes')}
              rows={3}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              fullWidth
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              fullWidth
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Payment & Review */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Choose how you'd like to pay</CardDescription>
          </CardHeader>
          <div className="space-y-4 mt-4">
            {/* Payment Methods */}
            <div className="space-y-2">
              {acceptedPaymentMethods.includes('cash_on_delivery') && (
                <label className={cn(
                  'relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all',
                  watch('paymentMethod') === 'cash_on_delivery'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    {...register('paymentMethod')}
                    value="cash_on_delivery"
                    className="sr-only"
                  />
                  <span className="font-medium">Cash on Delivery</span>
                </label>
              )}
              {acceptedPaymentMethods.includes('mtn_mobile_money') && (
                <label className={cn(
                  'relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all',
                  watch('paymentMethod') === 'mtn_mobile_money'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    {...register('paymentMethod')}
                    value="mtn_mobile_money"
                    className="sr-only"
                  />
                  <span className="font-medium">MTN Mobile Money</span>
                </label>
              )}
              {acceptedPaymentMethods.includes('airtel_mobile_money') && (
                <label className={cn(
                  'relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all',
                  watch('paymentMethod') === 'airtel_mobile_money'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}>
                  <input
                    type="radio"
                    {...register('paymentMethod')}
                    value="airtel_mobile_money"
                    className="sr-only"
                  />
                  <span className="font-medium">Airtel Mobile Money</span>
                </label>
              )}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{formatCurrency(calculatedDeliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
</div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
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
              Place Order
            </Button>
          </div>
        </Card>
      )}
    </form>
  )
}