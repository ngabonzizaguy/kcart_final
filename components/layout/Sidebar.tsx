'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Menu as MenuIcon, BarChart3, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import LanguageSwitcher from './LanguageSwitcher'

interface SidebarProps {
  locale: string
  translations: {
    home: string
    orders: string
    menu: string
    analytics: string
    profile: string
    logout: string
  }
}

export default function Sidebar({ locale, translations }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: translations.home, href: '/dashboard', icon: Home },
    { name: translations.orders, href: '/dashboard/orders', icon: ShoppingBag },
    { name: translations.menu, href: '/dashboard/menu', icon: MenuIcon },
    { name: translations.analytics, href: '/dashboard/analytics', icon: BarChart3 },
    { name: translations.profile, href: '/dashboard/profile', icon: User },
  ]

  const handleLogout = async () => {
    // Logout logic will be implemented with Supabase
    window.location.href = '/login'
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-warm border-r border-white/20">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <h1 className="text-2xl font-bold bg-gradient-orange bg-clip-text text-transparent">
            DeliGo
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-white/25 backdrop-blur-md text-primary-700 shadow-md'
                    : 'text-gray-700 hover:bg-white/10 hover:text-primary-600'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-500'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0 px-3 space-y-3">
          {/* Language Switcher */}
          <div className="px-4">
            <LanguageSwitcher
              currentLocale={locale as any}
              onLocaleChange={(newLocale) => {
                // Language switching logic
                document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
                window.location.reload()
              }}
            />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-white/10 hover:text-status-error rounded-xl transition-all"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-status-error" />
            {translations.logout}
          </button>
        </div>
      </div>
    </aside>
  )
}
