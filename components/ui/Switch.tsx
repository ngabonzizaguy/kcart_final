import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      size = 'md',
      className,
    },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled) {
        onChange(!checked)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleClick()
      }
    }

    const sizes = {
      sm: 'w-9 h-5',
      md: 'w-11 h-6',
    }

    const knobSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
    }

    const knobTranslate = {
      sm: checked ? 'translate-x-4' : 'translate-x-0',
      md: checked ? 'translate-x-5' : 'translate-x-0',
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          checked ? 'bg-green-500' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          sizes[size],
          className
        )}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out',
            knobSizes[size],
            knobTranslate[size]
          )}
        />
      </button>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch