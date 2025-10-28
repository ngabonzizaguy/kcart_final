'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AnalyticsData {
  kpis: {
    totalVendors: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
  };
  revenue: {
    timeline: Array<{ date: string; revenue: number; commission: number }>;
  };
  orders: {
    byStatus: Array<{ date: string; new: number; preparing: number; completed: number; cancelled: number }>;
  };
  topVendors: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  customerGrowth: Array<{
    date: string;
    newCustomers: number;
    totalCustomers: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [granularity, setGranularity] = useState('day'); // day, week, month

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, granularity]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/analytics?dateRange=${dateRange}&granularity=${granularity}`
      );

      if (response.status === 403) {
        // Redirect to unauthorized page
        window.location.href = '/unauthorized';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const analyticsData = await response.json();

      // Check if data is empty
      const hasData =
        analyticsData.revenue?.timeline?.length > 0 ||
        analyticsData.orders?.byStatus?.length > 0 ||
        analyticsData.topVendors?.length > 0 ||
        analyticsData.kpis;

      if (!hasData) {
        setError('No data available for the selected date range');
        setData(null);
      } else {
        setData(analyticsData);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to fetch analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-md text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Analytics Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform performance insights</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Vendors */}
        <Card glass padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.kpis.totalVendors}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card glass padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.kpis.totalCustomers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Orders */}
        <Card glass padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.kpis.totalOrders}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        {/* Total Revenue (GMV) */}
        <Card glass padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(data.kpis.totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500">RWF</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Platform Commission */}
        <Card glass padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commission</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(data.kpis.totalCommission / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500">RWF</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card glass padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trends</h2>
            <p className="text-sm text-gray-600">GMV and platform commission over time</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.revenue.timeline.map(({ date, ...rest }) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...rest,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2}
              name="GMV (RWF)"
              dot={{ fill: '#f97316', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="commission"
              stroke="#16a34a"
              strokeWidth={2}
              name="Commission (RWF)"
              dot={{ fill: '#16a34a', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Orders by Status Chart */}
      <Card glass padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Orders by Status</h2>
            <p className="text-sm text-gray-600">Order status distribution over time</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.orders.byStatus.map(({ date, ...rest }) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...rest,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="new" fill="#eab308" name="New" stackId="a" />
            <Bar dataKey="preparing" fill="#f97316" name="Preparing" stackId="a" />
            <Bar dataKey="completed" fill="#16a34a" name="Completed" stackId="a" />
            <Bar dataKey="cancelled" fill="#dc2626" name="Cancelled" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Vendors & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <Card glass padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Vendors</h2>
              <p className="text-sm text-gray-600">By revenue generated</p>
            </div>
          </div>

          <div className="space-y-4">
            {data.topVendors.slice(0, 5).map((vendor, index) => (
              <div key={vendor.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-sm text-gray-600">{vendor.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {vendor.revenue.toLocaleString()} RWF
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card glass padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
              <p className="text-sm text-gray-600">Distribution by method</p>
            </div>
          </div>

           <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const method = entry.method as string | undefined;
                  const percent = entry.percent as number;
                  return method ? `${method.replace(/_/g, ' ')}: ${(percent * 100).toFixed(0)}%` : '';
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.paymentMethods.map((method, index) => (
              <div key={method.method} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-700">
                    {method.method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                <span className="font-medium text-gray-900">
                  {method.revenue.toLocaleString()} RWF
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card glass padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Customer Growth</h2>
            <p className="text-sm text-gray-600">New and total customers over time</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data.customerGrowth.map(({ date, ...rest }) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            ...rest,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="newCustomers"
              stroke="#f97316"
              strokeWidth={2}
              name="New Customers"
              dot={{ fill: '#f97316', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="totalCustomers"
              stroke="#6366f1"
              strokeWidth={2}
              name="Total Customers"
              dot={{ fill: '#6366f1', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}