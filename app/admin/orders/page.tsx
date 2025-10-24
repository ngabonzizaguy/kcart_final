'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorLogo: string | null;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  commissionAmount: number | null;
  vendorAmount: number | null;
  createdAt: string;
}

type StatusFilter = 'all' | 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
type PaymentMethodFilter = 'all' | 'cash_on_delivery' | 'mtn_mobile_money' | 'airtel_mobile_money';
type PaymentStatusFilter = 'all' | 'success' | 'pending' | 'failed';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentMethodFilter, paymentStatusFilter, dateFrom, dateTo, searchQuery]);

  // Real-time updates with Supabase Realtime would go here
  // useEffect(() => {
  //   const channel = supabase.channel('admin-orders')...
  // }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentMethodFilter !== 'all') params.append('paymentMethod', paymentMethodFilter);
      if (paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'COD';
      case 'mtn_mobile_money':
        return 'MTN MoMo';
      case 'airtel_mobile_money':
        return 'Airtel Money';
      default:
        return method;
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderId',
      header: 'Order ID',
      render: (order) => (
        <span className="font-mono font-medium text-gray-900">
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (order) => (
        <div className="flex items-center gap-2">
          {order.vendorLogo ? (
            <img
              src={order.vendorLogo}
              alt={order.vendorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
            </div>
          )}
          <span className="text-sm text-gray-700">{order.vendorName}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => (
        <div>
          <p className="text-sm text-gray-900">{order.customerName}</p>
          <p className="text-xs text-gray-500">{order.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (order) => (
        <div>
          <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
          {order.commissionAmount && (
            <p className="text-xs text-gray-500">
              Commission: {formatCurrency(order.commissionAmount)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (order) => (
        <div className="space-y-1">
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            {getPaymentMethodLabel(order.paymentMethod)}
          </span>
          {order.paymentStatus && (
            <div>
              <StatusBadge status={order.paymentStatus} type="payment" showIcon={false} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Order Status',
      render: (order) => <StatusBadge status={order.status} type="order" />,
    },
    {
      key: 'time',
      header: 'Time',
      render: (order) => (
        <span className="text-sm text-gray-600">
          {formatRelativeTime(new Date(order.createdAt))}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All', value: 'all' as const, icon: Filter },
    { label: 'New', value: 'new' as const, icon: Clock },
    { label: 'Preparing', value: 'preparing' as const, icon: Clock },
    { label: 'Ready', value: 'ready' as const, icon: CheckCircle },
    { label: 'Completed', value: 'completed' as const, icon: CheckCircle },
    { label: 'Cancelled', value: 'cancelled' as const, icon: XCircle },
  ];

  const paymentMethodOptions = [
    { label: 'All Payments', value: 'all' as const },
    { label: 'COD', value: 'cash_on_delivery' as const },
    { label: 'MTN MoMo', value: 'mtn_mobile_money' as const },
    { label: 'Airtel Money', value: 'airtel_mobile_money' as const },
  ];

  const paymentStatusOptions = [
    { label: 'All Status', value: 'all' as const },
    { label: '🟢 Paid', value: 'success' as const },
    { label: '🟠 Pending', value: 'pending' as const },
    { label: '🔴 Failed', value: 'failed' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
        <p className="text-gray-600 mt-1">Monitor all platform orders in real-time</p>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by order ID, customer name, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Dates
                </button>
              </div>
            )}
          </div>

          {/* Status Filter Chips */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    statusFilter === option.value
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                      : 'bg-white/50 text-gray-700 hover:bg-white/70'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="flex gap-2 flex-wrap">
                {paymentMethodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPaymentMethodFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      paymentMethodFilter === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {paymentStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPaymentStatusFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      paymentStatusFilter === option.value
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        onRowClick={handleRowClick}
        emptyTitle="No orders found"
        emptyDescription="No orders match your current filters."
      />

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          title={`Order Details - ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-6">
            {/* Order Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Order Status</h3>
              <StatusBadge status={selectedOrder.status} type="order" />
            </div>

            {/* Vendor Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vendor</h3>
              <div className="flex items-center gap-3">
                {selectedOrder.vendorLogo ? (
                  <img
                    src={selectedOrder.vendorLogo}
                    alt={selectedOrder.vendorName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-orange-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{selectedOrder.vendorName}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Customer</h3>
              <div className="space-y-1">
                <p className="text-gray-900">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium">
                    {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                  </span>
                </div>
                {selectedOrder.paymentStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <StatusBadge status={selectedOrder.paymentStatus} type="payment" />
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Total:</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            {selectedOrder.commissionAmount && selectedOrder.vendorAmount && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Commission Breakdown
                </h3>
                <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Commission:</span>
                    <span className="font-medium text-orange-700">
                      {formatCurrency(selectedOrder.commissionAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor Amount:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(selectedOrder.vendorAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Order Timeline</h3>
              <p className="text-sm text-gray-600">
                Created: {new Date(selectedOrder.createdAt).toLocaleString('en-US', {
                  timeZone: 'Africa/Kigali',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}