'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingBag,
  Wallet,
  BarChart3,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendors', href: '/admin/vendors', icon: Store },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Payouts', href: '/admin/payouts', icon: Wallet },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Logs', href: '/admin/logs', icon: FileText },
  ];

  const handleLogout = async () => {
    // TODO: Implement proper Supabase logout
    window.location.href = '/login';
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-warm border-r border-white/20 z-30">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              kCart Admin
            </h1>
            <p className="text-xs text-gray-600 mt-1">Platform Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white/10 hover:text-orange-600'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-orange-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="flex-shrink-0 px-3">
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-white/10 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 group-hover:text-red-600" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}