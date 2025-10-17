'use client'

import { Clock, ChefHat, CheckCircle, Package, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatusType = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface OrderStatusProps {
  currentStatus: OrderStatusType
}

const statusSteps: {
  status: OrderStatusType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}[] = [
  {
    status: 'new',
    label: 'Order Received',
    icon: Clock,
    description: 'Your order has been received and is being reviewed',
  },
  {
    status: 'preparing',
    label: 'Preparing',
    icon: ChefHat,
    description: 'Your order is being prepared',
  },
  {
    status: 'ready',
    label: 'Ready',
    icon: CheckCircle,
    description: 'Your order is ready for pickup/delivery',
  },
  {
    status: 'completed',
    label: 'Completed',
    icon: Package,
    description: 'Your order has been completed. Enjoy your meal!',
  },
]

export default function OrderStatus({ currentStatus }: OrderStatusProps) {
  // Handle cancelled status separately
  if (currentStatus === 'cancelled') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-900">
          <XCircle className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg">Order Cancelled</h3>
            <p className="text-sm text-red-700">
              This order has been cancelled
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = statusSteps.findIndex((step) => step.status === currentStatus)
  const currentStep = statusSteps[currentIndex]

  return (
    <div className="space-y-6">
      {/* Current Status Message */}
      <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {currentStep && (
            <>
              <currentStep.icon className="w-6 h-6 text-primary-600" />
              <div>
                <h3 className="font-bold text-primary-900">
                  {currentStep.label}
                </h3>
                <p className="text-sm text-primary-700">
                  {currentStep.description}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="relative">
        <div className="flex justify-between items-start">
          {statusSteps.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex
            const Icon = step.icon

            return (
              <div key={step.status} className="flex flex-col items-center flex-1">
                {/* Icon Circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all z-10',
                    isCompleted && 'bg-primary-500 border-primary-500',
                    isCurrent && 'bg-primary-500 border-primary-500 ring-4 ring-primary-100',
                    isFuture && 'bg-gray-100 border-gray-300'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      (isCompleted || isCurrent) && 'text-white',
                      isFuture && 'text-gray-400'
                    )}
                  />
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      (isCompleted || isCurrent) && 'text-primary-700',
                      isFuture && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                </div>

                {/* Connecting Line */}
                {index < statusSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-6 h-0.5 transition-all',
                      'hidden md:block',
                      isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                    )}
                    style={{
                      left: `${(100 / statusSteps.length) * index + 100 / statusSteps.length / 2}%`,
                      right: `${100 - (100 / statusSteps.length) * (index + 1) + 100 / statusSteps.length / 2}%`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical stepper */}
      <div className="md:hidden space-y-4 mt-8">
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex
          const Icon = step.icon

          return (
            <div key={step.status} className="flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                  isCompleted && 'bg-primary-500 border-primary-500',
                  isCurrent && 'bg-primary-500 border-primary-500',
                  isFuture && 'bg-gray-100 border-gray-300'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    (isCompleted || isCurrent) && 'text-white',
                    isFuture && 'text-gray-400'
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4
                  className={cn(
                    'font-semibold',
                    (isCompleted || isCurrent) && 'text-gray-900',
                    isFuture && 'text-gray-500'
                  )}
                >
                  {step.label}
                </h4>
                {isCurrent && (
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}