import { CheckCircle, Clock, XCircle, AlertCircle, Ban } from 'lucide-react';

type StatusType = 'order' | 'payment' | 'payout' | 'vendor';

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  showIcon?: boolean;
}

export default function StatusBadge({
  status,
  type,
  showIcon = true,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase();

    // Order statuses
    if (type === 'order') {
      switch (normalizedStatus) {
        case 'new':
          return {
            bg: 'bg-yellow-100',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            icon: AlertCircle,
            label: 'New',
          };
        case 'preparing':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: Clock,
            label: 'Preparing',
          };
        case 'ready':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: CheckCircle,
            label: 'Ready',
          };
        case 'completed':
          return {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle,
            label: 'Completed',
          };
        case 'cancelled':
          return {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: XCircle,
            label: 'Cancelled',
          };
      }
    }

    // Payment statuses
    if (type === 'payment') {
      switch (normalizedStatus) {
        case 'success':
        case 'paid':
          return {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle,
            label: 'Paid',
          };
        case 'pending':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: Clock,
            label: 'Pending',
          };
        case 'failed':
          return {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: XCircle,
            label: 'Failed',
          };
      }
    }

    // Payout statuses
    if (type === 'payout') {
      switch (normalizedStatus) {
        case 'pending':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: Clock,
            label: 'Pending',
          };
        case 'processing':
          return {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            border: 'border-blue-200',
            icon: Clock,
            label: 'Processing',
          };
        case 'completed':
          return {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle,
            label: 'Completed',
          };
        case 'failed':
          return {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: XCircle,
            label: 'Failed',
          };
      }
    }

    // Vendor statuses
    if (type === 'vendor') {
      switch (normalizedStatus) {
        case 'verified':
          return {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle,
            label: 'Verified',
          };
        case 'unverified':
          return {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: AlertCircle,
            label: 'Unverified',
          };
        case 'active':
          return {
            bg: 'bg-green-100',
            text: 'text-green-700',
            border: 'border-green-200',
            icon: CheckCircle,
            label: 'Active',
          };
        case 'suspended':
          return {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: Ban,
            label: 'Suspended',
          };
      }
    }

    // Default/fallback
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: AlertCircle,
      label: status,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
}