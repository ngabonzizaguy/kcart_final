'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Shield, 
  Store, 
  Wallet, 
  DollarSign, 
  ShoppingBag,
  Settings as SettingsIcon,
  Filter,
  Calendar
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatRelativeTime } from '@/lib/utils';

interface AdminLog {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  ipAddress: string | null;
  timestamp: string;
}

type ActionFilter = 'all' | 'vendor' | 'payout' | 'commission' | 'settings' | 'order';

export default function LogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs(true);
  }, [actionFilter, dateFrom, dateTo, searchQuery]);

  // Real-time updates would go here
  // useEffect(() => {
  //   const channel = supabase.channel('admin-logs')...
  // }, []);

  const fetchLogs = async (reset: boolean = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (actionFilter !== 'all') params.append('targetType', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', reset ? '1' : page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/admin/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();

      if (reset) {
        setLogs(data.logs || []);
        setPage(1);
      } else {
        setLogs((prev) => [...prev, ...(data.logs || [])]);
      }

      setHasMore(data.logs.length === 50);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    fetchLogs(false);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('targetType', actionFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/logs/export?${params}`);
      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionIcon = (targetType: string) => {
    switch (targetType) {
      case 'vendor':
        return { icon: Store, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'payout':
        return { icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' };
      case 'order':
        return { icon: ShoppingBag, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'settings':
        return { icon: SettingsIcon, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'commission':
        return { icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { icon: Shield, color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const getActionDescription = (log: AdminLog): string => {
    const action = log.action;
    const details = log.details;

    switch (action) {
      case 'vendor_verified':
        return `Verified vendor: ${details.vendorName}`;
      case 'vendor_unverified':
        return `Unverified vendor: ${details.vendorName}`;
      case 'vendor_suspended':
        return `Suspended vendor: ${details.vendorName}`;
      case 'vendor_reactivated':
        return `Reactivated vendor: ${details.vendorName}`;
      case 'commission_updated':
        return `Updated commission for ${details.vendorName} from ${details.previousRate}% to ${details.newRate}%`;
      case 'commission_global_updated':
        return `Updated global commission rate from ${details.previousRate}% to ${details.newRate}%`;
      case 'payout_processed':
        return `Processed payout for ${details.vendorName}: ${details.amount} RWF`;
      case 'payout_batch_processed':
        return `Processed batch payout: ${details.vendorCount} vendors, ${details.totalAmount} RWF`;
      case 'payout_failed':
        return `Payout failed for ${details.vendorName}`;
      case 'payout_retried':
        return `Retried payout for ${details.vendorName}`;
      case 'settings_updated':
        return `Updated platform settings`;
      case 'commission_calculated':
        return `Commission calculated for order (${details.platformCommission} RWF)`;
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const filterOptions = [
    { label: 'All Actions', value: 'all' as const, icon: Filter },
    { label: 'Vendor Actions', value: 'vendor' as const, icon: Store },
    { label: 'Payout Actions', value: 'payout' as const, icon: Wallet },
    { label: 'Commission', value: 'commission' as const, icon: DollarSign },
    { label: 'Order Actions', value: 'order' as const, icon: ShoppingBag },
    { label: 'Settings', value: 'settings' as const, icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">View all admin actions and system events</p>
        </div>

        <Button
          variant="secondary"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
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
                <Calendar className="inline h-4 w-4 mr-1" />
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
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Action Type
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setActionFilter(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      actionFilter === option.value
                        ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                        : 'bg-white/50 text-gray-700 hover:bg-white/70'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      {loading && logs.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">No audit logs match your current filters.</p>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />

          <div className="space-y-4">
            {logs.map((log, index) => {
              const { icon: Icon, color, bg } = getActionIcon(log.targetType);
              const isExpanded = expandedLogs.has(log.id);

              return (
                <div key={log.id} className="relative">
                  {/* Timeline Node */}
                  <div className={`absolute left-5 w-6 h-6 rounded-full ${bg} border-4 border-white hidden md:flex items-center justify-center z-10`}>
                    <Icon className={`h-3 w-3 ${color}`} />
                  </div>

                  {/* Log Card */}
                  <Card
                    glass
                    hover
                    className="md:ml-20 cursor-pointer"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Mobile Icon */}
                      <div className={`md:hidden flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {getActionDescription(log)}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              by <span className="font-medium">{log.adminName}</span>
                              {log.ipAddress && (
                                <span className="text-gray-400"> • {log.ipAddress}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm text-gray-500">
                              {formatRelativeTime(new Date(log.timestamp))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(log.timestamp).toLocaleString('en-US', {
                                timeZone: 'Africa/Kigali',
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Details</h4>
                            <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                            <div className="mt-3 text-xs text-gray-600 space-y-1">
                              <p>
                                <span className="font-medium">Action:</span> {log.action}
                              </p>
                              <p>
                                <span className="font-medium">Target:</span> {log.targetType} (ID: {log.targetId})
                              </p>
                              <p>
                                <span className="font-medium">Admin:</span> {log.adminEmail}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center mt-6">
              <Button variant="secondary" onClick={handleLoadMore}>
                Load More Logs
              </Button>
            </div>
          )}

          {loading && logs.length > 0 && (
            <div className="text-center mt-6">
              <LoadingSpinner size="md" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}