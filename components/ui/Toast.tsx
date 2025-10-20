'use client'

import { Fragment, useEffect, useCallback } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  show: boolean
  type: ToastType
  title?: string
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({
  show,
  type,
  title,
  message,
  onClose,
  duration = 5000,
}: ToastProps) {
  // ✅ FIXED: Moved setTimeout into useEffect
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const colors = {
    success: 'text-status-success bg-green-50 border-green-200',
    error: 'text-status-error bg-red-50 border-red-200',
    warning: 'text-status-warning bg-orange-50 border-orange-200',
    info: 'text-status-info bg-blue-50 border-blue-200',
  }

  const Icon = icons[type]

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
        <div
          className={cn(
            'rounded-xl border p-4 shadow-lg backdrop-blur-md',
            colors[type]
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {title && (
                <p className="font-semibold text-gray-900">{title}</p>
              )}
              <p className="text-sm text-gray-700">{message}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1 hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  )
}

// Toast context and hook for global toast management
import { createContext, useContext, useState, ReactNode } from 'react'

interface ToastContextType {
  showToast: (props: Omit<ToastProps, 'show' | 'onClose'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastProps, setToastProps] = useState<ToastProps | null>(null)

  // ✅ FIXED: Wrapped showToast in useCallback to prevent recreating on every render
  const showToast = useCallback((props: Omit<ToastProps, 'show' | 'onClose'>) => {
    setToastProps({
      ...props,
      show: true,
      onClose: () => setToastProps(null),
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastProps && <Toast {...toastProps} />}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}