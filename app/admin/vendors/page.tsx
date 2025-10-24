'use client';

import { useState, useEffect } from 'react';
import { Store, Search, MoreVertical, Eye, Edit, Ban, CheckCircle, XCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

interface Vendor {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  logoUrl: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  totalOrders: number;
  payoutBalance: number;
  commissionRate: number | null;
  slug: string;
}

type FilterType = 'all' | 'verified' | 'unverified' | 'active' | 'suspended' | 'high_performers';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionValue, setCommissionValue] = useState('');

  useEffect(() => {
    fetchVendors();
  }, [activeFilter, searchQuery]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeFilter !== 'all') params.append('status', activeFilter);

      const response = await fetch(`/api/admin/vendors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (vendor: Vendor) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !vendor.isVerified }),
      });

      if (!response.ok) throw new Error('Failed to update verification');
      
      fetchVendors();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update vendor verification');
    }
  };

  const handleSuspendToggle = async (vendor: Vendor) => {
    try {
      const reason = vendor.isSuspended 
        ? 'Reactivated by admin' 
        : prompt('Reason for suspension:');
      
      if (!vendor.isSuspended && !reason) return;

      const response = await fetch(`/api/admin/vendors/${vendor.id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          suspended: !vendor.isSuspended,
          reason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update suspension');
      
      fetchVendors();
      setShowActionMenu(null);
    } catch (error) {
      console.error('Error updating suspension:', error);
      alert('Failed to update vendor suspension');
    }
  };

  const handleCommissionUpdate = async () => {
    if (!selectedVendor) return;

    try {
      const rate = parseFloat(commissionValue);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        alert('Please enter a valid commission rate (0-100)');
        return;
      }

      const response = await fetch(`/api/admin/vendors/${selectedVendor.id}/commission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionPercentage: rate }),
      });

      if (!response.ok) throw new Error('Failed to update commission');
      
      fetchVendors();
      setShowCommissionModal(false);
      setSelectedVendor(null);
      setCommissionValue('');
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission rate');
    }
  };

  const columns: Column<Vendor>[] = [
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
              <Store className="w-5 h-5 text-orange-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{vendor.businessName}</p>
            <p className="text-sm text-gray-500">{vendor.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (vendor) => (
        <div className="flex gap-2">
          <StatusBadge 
            status={vendor.isVerified ? 'verified' : 'unverified'} 
            type="vendor" 
          />
          {vendor.isSuspended && (
            <StatusBadge status="suspended" type="vendor" />
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (vendor) => (
        <span className="font-medium text-gray-900">{vendor.totalOrders}</span>
      ),
    },
    {
      key: 'balance',
      header: 'Payout Balance',
      render: (vendor) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(vendor.payoutBalance)}
        </span>
      ),
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (vendor) => (
        <span className="text-sm text-gray-600">
          {vendor.commissionRate ? `${vendor.commissionRate}%` : 'Global'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vendor) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActionMenu(showActionMenu === vendor.id ? null : vendor.id);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>

          {showActionMenu === vendor.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
              <button
                onClick={() => handleVerifyToggle(vendor)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                {vendor.isVerified ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {vendor.isVerified ? 'Unverify' : 'Verify'}
              </button>
              <button
                onClick={() => {
                  setSelectedVendor(vendor);
                  setCommissionValue(vendor.commissionRate?.toString() || '');
                  setShowCommissionModal(true);
                  setShowActionMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Commission
              </button>
              <button
                onClick={() => handleSuspendToggle(vendor)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Ban className="h-4 w-4" />
                {vendor.isSuspended ? 'Reactivate' : 'Suspend'}
              </button>
              <a
                href={`/${vendor.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View Storefront
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  const filterOptions = [
    { label: 'All', value: 'all' as const },
    { label: 'Verified', value: 'verified' as const },
    { label: 'Unverified', value: 'unverified' as const },
    { label: 'Active', value: 'active' as const },
    { label: 'Suspended', value: 'suspended' as const },
    { label: 'High Performers (>100 orders)', value: 'high_performers' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-gray-600 mt-1">Manage all vendors on the platform</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
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
        </div>
      </Card>

      {/* Vendors Table */}
      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        emptyTitle="No vendors found"
        emptyDescription="No vendors match your current filters."
      />

      {/* Commission Modal */}
      {showCommissionModal && selectedVendor && (
        <Modal
          isOpen={showCommissionModal}
          onClose={() => {
            setShowCommissionModal(false);
            setSelectedVendor(null);
            setCommissionValue('');
          }}
          title={`Edit Commission - ${selectedVendor.businessName}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                placeholder="e.g., 15.0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to use global rate
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCommissionModal(false);
                  setSelectedVendor(null);
                  setCommissionValue('');
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCommissionUpdate}>
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}