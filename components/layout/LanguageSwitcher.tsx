'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
  className?: string
}

export default function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  className,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
      >
        <Languages className="h-5 w-5" />
        <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/90 backdrop-blur-xl border border-white/20 shadow-glass z-20 overflow-hidden">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  onLocaleChange(locale)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm transition-colors',
                  locale === currentLocale
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {localeNames[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
