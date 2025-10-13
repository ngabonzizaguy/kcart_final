import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'

    const variants = {
      primary: 'bg-gradient-orange text-white shadow-warm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-white/10 backdrop-blur-md text-gray-900 border border-white/20 hover:bg-white/20',
      outline: 'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      danger: 'bg-status-error text-white hover:bg-red-600 shadow-md hover:shadow-lg',
    }

    const sizes = {
      sm: 'text-sm px-4 py-2 min-h-touch',
      md: 'text-base px-6 py-3 min-h-touch',
      lg: 'text-lg px-8 py-4 min-h-touch',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
