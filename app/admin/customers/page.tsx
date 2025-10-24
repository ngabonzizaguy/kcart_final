'use client';

import { useState, useEffect } from 'react';
import { Users, Search, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/admin/DataTable';
import Input from '@/components/ui/Input';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpend: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  firstOrderAt: string;
  favoriteVendorName: string | null;
}

type FilterType = 'all' | 'high_value' | 'recent' | 'inactive';
type SortType = 'spend_desc' | 'spend_asc' | 'orders_desc' | 'orders_asc' | 'recent' | 'oldest';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('spend_desc');

  useEffect(() => {
    fetchCustomers();
  }, [activeFilter, sortBy, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'all') params.append('filter', activeFilter);
      params.append('sort', sortBy);

      const response = await fetch(`/api/admin/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: (customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{customer.name}</p>
            <p className="text-sm text-gray-500">{customer.phone}</p>
            {customer.email && (
              <p className="text-xs text-gray-400">{customer.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Total Orders',
      render: (customer) => (
        <span className="font-medium text-gray-900">{customer.totalOrders}</span>
      ),
    },
    {
      key: 'spend',
      header: 'Total Spend',
      render: (customer) => (
        <div>
          <p className="font-medium text-gray-900">
            {formatCurrency(customer.totalSpend)}
          </p>
          <p className="text-xs text-gray-500">
            Avg: {formatCurrency(customer.averageOrderValue)}
          </p>
        </div>
      ),
    },
    {
      key: 'lastOrder',
      header: 'Last Order',
      render: (customer) => (
        <span className="text-sm text-gray-600">
          {customer.lastOrderAt
            ? formatRelativeTime(new Date(customer.lastOrderAt))
            : 'Never'}
        </span>
      ),
    },
    {
      key: 'favoriteVendor',
      header: 'Favorite Vendor',
      render: (customer) => (
        <span className="text-sm text-gray-600">
          {customer.favoriteVendorName || '-'}
        </span>
      ),
    },
    {
      key: 'memberSince',
      header: 'Member Since',
      render: (customer) => (
        <span className="text-sm text-gray-600">
          {formatRelativeTime(new Date(customer.firstOrderAt))}
        </span>
      ),
    },
  ];

  const filterOptions = [
    { label: 'All Customers', value: 'all' as const },
    { label: 'High Value (>100k)', value: 'high_value' as const },
    { label: 'Recent (7 days)', value: 'recent' as const },
    { label: 'Inactive (30+ days)', value: 'inactive' as const },
  ];

  const sortOptions = [
    { label: 'Spend: High to Low', value: 'spend_desc' as const },
    { label: 'Spend: Low to High', value: 'spend_asc' as const },
    { label: 'Orders: Most to Least', value: 'orders_desc' as const },
    { label: 'Orders: Least to Most', value: 'orders_asc' as const },
    { label: 'Last Order: Recent First', value: 'recent' as const },
    { label: 'Last Order: Oldest First', value: 'oldest' as const },
  ];

  // Calculate summary stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const avgOrderValue = totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0;
  const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
        <p className="text-gray-600 mt-1">View customer behavior and lifetime value</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glass padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="rounded-full p-3 bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card glass padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-full p-3 bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card glass padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
            <div className="rounded-full p-3 bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card glass padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {repeatRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {repeatCustomers} of {totalCustomers}
              </p>
            </div>
            <div className="rounded-full p-3 bg-orange-100">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search, Filters & Sort */}
      <Card>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter.value
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                      : 'bg-white/50 text-gray-700 hover:bg-white/70'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-2 rounded-xl bg-white/50 border border-white/20 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyTitle="No customers found"
        emptyDescription="No customers match your current filters."
      />
    </div>
  );
}