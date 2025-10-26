'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface DashboardData {
  kpis: {
    totalVendors: number;
    totalCustomers: number;
    totalOrders: number;
    gmv: number;
    platformCommission: number;
    pendingPayouts: number;
    changes: {
      vendors: number;
      customers: number;
      orders: number;
      gmv: number;
      commission: number;
    };
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    vendorName: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
  pendingPayoutsCount: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const renderChangeIndicator = (change: number) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    return (
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <Icon className="h-4 w-4" />
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  const kpiCards = [
    {
      title: 'Total Vendors',
      value: data.kpis.totalVendors,
      change: data.kpis.changes.vendors,
      icon: Store,
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/admin/vendors',
    },
    {
      title: 'Total Customers',
      value: data.kpis.totalCustomers,
      change: data.kpis.changes.customers,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/admin/customers',
    },
    {
      title: 'Total Orders',
      value: data.kpis.totalOrders,
      change: data.kpis.changes.orders,
      icon: ShoppingBag,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      link: '/admin/orders',
    },
    {
      title: 'GMV (Gross Merchandise Value)',
      value: formatCurrency(data.kpis.gmv),
      change: data.kpis.changes.gmv,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      isHighlight: true,
    },
    {
      title: 'Platform Commission',
      value: formatCurrency(data.kpis.platformCommission),
      change: data.kpis.changes.commission,
      icon: DollarSign,
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      link: '/admin/analytics',
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(data.kpis.pendingPayouts),
      subtitle: `${data.pendingPayoutsCount} vendor${data.pendingPayoutsCount !== 1 ? 's' : ''}`,
      icon: Wallet,
      color: 'amber',
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      link: '/admin/payouts',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to DeliGo platform management</p>
        </div>

        {/* Period Filter */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const CardWrapper = kpi.link ? Link : 'div';
          const cardProps = kpi.link ? { href: kpi.link } : {};

          return (
            <CardWrapper key={kpi.title} {...cardProps}>
              <Card
                glass
                padding="md"
                className={`transition-all ${
                  kpi.link ? 'hover:shadow-xl hover:scale-105 cursor-pointer' : ''
                } ${kpi.isHighlight ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                    </p>
                    {kpi.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>
                    )}
                    <div className="mt-2">{renderChangeIndicator(kpi.change || 0)}</div>
                  </div>
                  <div className={`rounded-full p-3 ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                  </div>
                </div>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card glass padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-sm text-gray-600 mt-1">Latest transactions across the platform</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders`}
                className="block p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-all border border-white/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-sm font-semibold text-gray-900 truncate">
                          {order.orderNumber}
                        </p>
                        <StatusBadge status={order.status} type="order" />
                      </div>
                      <p className="text-sm text-gray-600 truncate">{order.vendorName}</p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(new Date(order.createdAt))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card glass padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/vendors"
            className="p-4 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white hover:shadow-lg transition-all"
          >
            <Store className="h-6 w-6 mb-2" />
            <p className="font-medium">Manage Vendors</p>
            <p className="text-xs opacity-90 mt-1">Verify, suspend, commissions</p>
          </Link>

          <Link
            href="/admin/orders"
            className="p-4 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:shadow-lg transition-all"
          >
            <ShoppingBag className="h-6 w-6 mb-2" />
            <p className="font-medium">View Orders</p>
            <p className="text-xs opacity-90 mt-1">Monitor all transactions</p>
          </Link>

          <Link
            href="/admin/payouts"
            className="p-4 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white hover:shadow-lg transition-all"
          >
            <Wallet className="h-6 w-6 mb-2" />
            <p className="font-medium">Process Payouts</p>
            <p className="text-xs opacity-90 mt-1">Run batch payouts</p>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-4 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:shadow-lg transition-all"
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <p className="font-medium">View Analytics</p>
            <p className="text-xs opacity-90 mt-1">Platform insights</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
