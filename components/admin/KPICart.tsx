'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number; // Percentage change from previous period
  subtitle?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  iconColor = 'text-orange-600',
  iconBgColor = 'bg-orange-100',
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined;

  return (
    <Card glass padding="md" hover className="transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

          {hasChange && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {subtitle && (
                <span className="text-sm text-gray-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        <div className={`rounded-full p-3 ${iconBgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}