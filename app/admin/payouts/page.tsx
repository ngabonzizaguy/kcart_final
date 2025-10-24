'use client';

import { useState, useEffect } from 'react';
import { Wallet, Download, RefreshCw, Play, CheckSquare } from 'lucide-react';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface Payout {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string | null;
  amount: number;
  status: string;
  batchId: string | null;
  transactionCount: number;
  createdAt: string;
  processedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
}

interface EligibleVendor {
  id: string;
  businessName: string;
  logoUrl: string | null;
  payoutBalance: number;
  totalOrders: number;
  lastPayoutAt: string | null;
}

type StatusTab = 'pending' | 'processing' | 'completed' | 'failed';

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>('pending');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [eligibleVendors, setEligibleVendors] = useState<EligibleVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [activeTab]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', activeTab);

      const response = await fetch(`/api/admin/payouts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch payouts');
      const data = await response.json();
      
      setPayouts(data.payouts || []);
      if (activeTab === 'pending' && data.eligibleVendors) {
        setEligibleVendors(data.eligibleVendors || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedVendors.size === eligibleVendors.length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(eligibleVendors.map((v) => v.id)));
    }
  };

  const handleToggleVendor = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const handleBatchPayout = async () => {
    if (selectedVendors.size === 0) {
      alert('Please select at least one vendor');
      return;
    }

    setShowBatchModal(true);
  };

  const confirmBatchPayout = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/admin/payouts/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorIds: Array.from(selectedVendors),
        }),
      });

      if (!response.ok) throw new Error('Failed to process batch payout');

      const data = await response.json();
      alert(`Batch payout initiated! Batch ID: ${data.batchId}`);
      
      setShowBatchModal(false);
      setSelectedVendors(new Set());
      fetchPayouts();
    } catch (error) {
      console.error('Error processing batch payout:', error);
      alert('Failed to process batch payout');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryPayout = async (payoutId: string) => {
    if (!confirm('Are you sure you want to retry this payout?')) return;

    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to retry payout');

      alert('Payout retry initiated');
      fetchPayouts();
    } catch (error) {
      console.error('Error retrying payout:', error);
      alert('Failed to retry payout');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/admin/payouts/export?status=${activeTab}`);
      if (!response.ok) throw new Error('Failed to export payouts');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting payouts:', error);
      alert('Failed to export payouts');
    }
  };

  const payoutColumns: Column<Payout>[] = [
    {
      key: 'vendor',
      header: 'Vendor',
      render: (payout) => (
        <div className="flex items-center gap-3">
          {payout.vendorLogo ? (
            <img
              src={payout.vendorLogo}
              alt={payout.vendorName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
          )}
          <span className="font-medium text-gray-900">{payout.vendorName}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (payout) => (
        <div>
          <p className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
          <p className="text-xs text-gray-500">{payout.transactionCount} transactions</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payout) => <StatusBadge status={payout.status} type="payout" />,
    },
    {
      key: 'batch',
      header: 'Batch ID',
      render: (payout) => (
        <span className="text-sm text-gray-600 font-mono">
          {payout.batchId || '-'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (payout) => (
        <div>
          <p className="text-sm text-gray-900">
            {formatRelativeTime(new Date(payout.createdAt))}
          </p>
          {payout.completedAt && (
            <p className="text-xs text-gray-500">
              Completed: {formatRelativeTime(new Date(payout.completedAt))}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payout) => (
        <div className="flex gap-2">
          {payout.status === 'failed' && (
            <button
              onClick={() => handleRetryPayout(payout.id)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Retry payout"
            >
              <RefreshCw className="h-4 w-4 text-orange-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const eligibleColumns: Column<EligibleVendor>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (vendor) => (
        <input
          type="checkbox"
          checked={selectedVendors.has(vendor.id)}
          onChange={() => handleToggleVendor(vendor.id)}
          className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
        />
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (vendor) => (
        <div className="flex items-center gap-3">
          {vendor.logoUrl ? (
            <img
              src={vendor.logoUrl}
              alt={vendor.businessName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
          )}
          <span className="font-medium text-gray-900">{vendor.businessName}</span>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Payout Balance',
      render: (vendor) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(vendor.payoutBalance)}
        </span>
      ),
    },
    {
      key: 'orders',
      header: 'Total Orders',
      render: (vendor) => (
        <span className="text-gray-700">{vendor.totalOrders}</span>
      ),
    },
    {
      key: 'lastPayout',
      header: 'Last Payout',
      render: (vendor) => (
        <span className="text-sm text-gray-600">
          {vendor.lastPayoutAt
            ? formatRelativeTime(new Date(vendor.lastPayoutAt))
            : 'Never'}
        </span>
      ),
    },
  ];

  const tabs = [
    { label: 'Pending', value: 'pending' as const, color: 'orange' },
    { label: 'Processing', value: 'processing' as const, color: 'blue' },
    { label: 'Completed', value: 'completed' as const, color: 'green' },
    { label: 'Failed', value: 'failed' as const, color: 'red' },
  ];

  const totalSelectedAmount = eligibleVendors
    .filter((v) => selectedVendors.has(v.id))
    .reduce((sum, v) => sum + v.payoutBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Payouts</h1>
          <p className="text-gray-600 mt-1">Manage vendor payout processing</p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                : 'bg-white/50 text-gray-700 hover:bg-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Batch Actions Bar (Pending Tab Only) */}
      {activeTab === 'pending' && eligibleVendors.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <CheckSquare className="h-5 w-5" />
                {selectedVendors.size === eligibleVendors.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              <div className="text-sm text-gray-600">
                {selectedVendors.size > 0 && (
                  <span>
                    {selectedVendors.size} vendor{selectedVendors.size > 1 ? 's' : ''} selected
                    {' • '}
                    <span className="font-semibold">
                      {formatCurrency(totalSelectedAmount)}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {selectedVendors.size > 0 && (
              <Button
                variant="primary"
                onClick={handleBatchPayout}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Run Batch Payout
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : activeTab === 'pending' && eligibleVendors.length > 0 ? (
        <DataTable
          columns={eligibleColumns}
          data={eligibleVendors}
          emptyTitle="No eligible vendors"
          emptyDescription="No vendors have sufficient balance for payout."
        />
      ) : (
        <DataTable
          columns={payoutColumns}
          data={payouts}
          emptyTitle={`No ${activeTab} payouts`}
          emptyDescription={`There are no ${activeTab} payouts to display.`}
        />
      )}

      {/* Batch Confirmation Modal */}
      {showBatchModal && (
        <Modal
          isOpen={showBatchModal}
          onClose={() => !processing && setShowBatchModal(false)}
          title="Confirm Batch Payout"
        >
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Payout Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendors:</span>
                  <span className="font-medium">{selectedVendors.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(totalSelectedAmount)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              This will initiate payout processing for {selectedVendors.size} vendor
              {selectedVendors.size > 1 ? 's' : ''}. The payout will be processed in a batch
              and vendor balances will be updated accordingly.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowBatchModal(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmBatchPayout}
                disabled={processing}
                className="flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Confirm & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}