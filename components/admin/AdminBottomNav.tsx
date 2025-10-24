'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const primaryNav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendors', href: '/admin/vendors', icon: Store },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const secondaryNav = [
    { name: 'Customers', href: '/admin/customers' },
    { name: 'Payouts', href: '/admin/payouts' },
    { name: 'Settings', href: '/admin/settings' },
    { name: 'Logs', href: '/admin/logs' },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/75 backdrop-blur-lg border-t border-white/20 z-50">
        <div className="flex items-center justify-around h-16">
          {primaryNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full"
              >
                <div
                  className={cn(
                    'flex flex-col items-center transition-colors',
                    isActive ? 'text-orange-600' : 'text-gray-600'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-xl transition-all',
                      isActive && 'bg-gradient-to-r from-orange-400 to-orange-600'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-white' : 'text-gray-600'
                      )}
                    />
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <div className="flex flex-col items-center text-gray-600">
              <div className="p-2">
                <MoreHorizontal className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1 font-medium">More</span>
            </div>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-4">More Options</h3>
            <div className="space-y-2">
              {secondaryNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'block px-4 py-3 rounded-xl font-medium transition-colors',
                      isActive
                        ? 'bg-orange-100 text-orange-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}