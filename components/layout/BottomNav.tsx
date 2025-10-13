'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Menu as MenuIcon, BarChart3, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  translations: {
    home: string
    orders: string
    menu: string
    analytics: string
    profile: string
  }
}

export default function BottomNav({ translations }: BottomNavProps) {
  const pathname = usePathname()

  const navigation = [
    { name: translations.home, href: '/dashboard', icon: Home },
    { name: translations.orders, href: '/dashboard/orders', icon: ShoppingBag },
    { name: translations.menu, href: '/dashboard/menu', icon: MenuIcon },
    { name: translations.analytics, href: '/dashboard/analytics', icon: BarChart3 },
    { name: translations.profile, href: '/dashboard/profile', icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-40 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors min-h-touch',
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-primary-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate max-w-full px-1">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
