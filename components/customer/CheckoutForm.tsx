'use client'

import { useState } from 'react'
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
    formState: { errors },
    trigger,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      deliveryType: 'delivery',
      paymentMethod: 'cash_on_delivery',
    },
  })

  const deliveryType = watch('deliveryType')
  const calculatedDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0
  const total = subtotal + calculatedDeliveryFee

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

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setLoading(true)

    try {
      const orderData = {
        vendorId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        deliveryType: data.deliveryType,
        deliveryAddress: data.deliveryAddress || undefined,
        deliveryNotes: data.deliveryNotes || undefined,
        paymentMethod: data.paymentMethod,
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          nameRw: item.nameRw,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
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

      // Clear cart and navigate to order tracking
      clearCart()
      showToast({
        type: 'success',
        message: 'Order placed successfully!',
      })
      router.push(`/${vendorSlug}/orders/${order.orderNumber}`)
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
    <Card>
      <CardHeader>
        <div className="text-center mb-4">
          <div className="text-sm text-gray-500 mb-2">
            Step {currentStep} of 3
          </div>
          <CardTitle>Checkout</CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* Step 1: Customer Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="John Doe"
              error={errors.customerName?.message}
              {...register('customerName')}
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+250 788 123 456"
              error={errors.customerPhone?.message}
              {...register('customerPhone')}
            />

            <Input
              label="Email (optional)"
              type="email"
              placeholder="john@example.com"
              error={errors.customerEmail?.message}
              {...register('customerEmail')}
            />

            <Button
              type="button"
              onClick={handleNextStep}
              fullWidth
              className="min-h-touch"
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Delivery Method */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Method
              </label>

              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value="delivery"
                  {...register('deliveryType')}
                  className="w-5 h-5 text-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium">🚚 Delivery</div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(deliveryFee)}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  value="pickup"
                  {...register('deliveryType')}
                  className="w-5 h-5 text-primary-500"
                />
                <div className="flex-1">
                  <div className="font-medium">🏪 Pickup</div>
                  <div className="text-sm text-gray-500">Free</div>
                </div>
              </label>
            </div>

            {deliveryType === 'delivery' && (
              <>
                <Input
                  label="Delivery Address"
                  placeholder="123 Main St, Kigali"
                  error={errors.deliveryAddress?.message}
                  {...register('deliveryAddress')}
                />

                <TextArea
                  label="Delivery Notes (optional)"
                  placeholder="Ring bell twice, gate code, etc."
                  error={errors.deliveryNotes?.message}
                  {...register('deliveryNotes')}
                  rows={3}
                />
              </>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="outline"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                fullWidth
                className="min-h-touch"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                {cartItems.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between">
                    <span className="text-gray-700">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {calculatedDeliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Delivery Fee:</span>
                  <span className="font-semibold">
                    {formatCurrency(calculatedDeliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white/95 backdrop-blur-lg border-2 border-orange-200 rounded-2xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  watch('paymentMethod') === 'cash_on_delivery' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}>
                  <input
                    type="radio"
                    value="cash_on_delivery"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">💵 Cash on Delivery</div>
                    <div className="text-xs text-gray-600">Pay when you receive your order</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  watch('paymentMethod') === 'mtn_mobile_money' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}>
                  <input
                    type="radio"
                    value="mtn_mobile_money"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">📱 MTN Mobile Money</div>
                    <div className="text-xs text-gray-600">You will receive payment instructions after order placement</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  watch('paymentMethod') === 'airtel_mobile_money' 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}>
                  <input
                    type="radio"
                    value="airtel_mobile_money"
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">📱 Airtel Money</div>
                    <div className="text-xs text-gray-600">You will receive payment instructions after order placement</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Info</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{watch('customerName')}</p>
                <p>{watch('customerPhone')}</p>
                {watch('customerEmail') && <p>{watch('customerEmail')}</p>}
              </div>
            </div>

            {/* Delivery Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Info</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium capitalize">{deliveryType}</p>
                {deliveryType === 'delivery' && watch('deliveryAddress') && (
                  <p>{watch('deliveryAddress')}</p>
                )}
                {watch('deliveryNotes') && (
                  <p className="text-gray-600 italic">
                    Note: {watch('deliveryNotes')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="outline"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
                className="min-h-touch"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  )
}