import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  fullWidth?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-status-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'px-4 py-3 pr-10 rounded-xl border transition-all duration-200',
              'bg-white/50 backdrop-blur-sm appearance-none',
              'text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-touch',
              error
                ? 'border-status-error focus:ring-status-error'
                : 'border-gray-200 hover:border-gray-300',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
