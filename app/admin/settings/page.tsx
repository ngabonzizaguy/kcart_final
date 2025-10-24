'use client';

import { useState, useEffect } from 'react';
import { Save, Shield, CreditCard, Palette, Globe, Users as UsersIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlatformSettings {
  id: string;
  globalCommissionPercentage: number;
  payoutAutomationEnabled: boolean;
  payoutSchedule: string;
  minimumPayoutAmount: number;
  acceptedPaymentMethods: string[];
  platformName: string;
  platformLogo: string | null;
  supportEmail: string;
  timezone: string;
  locale: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('commission');

  // MTN/Airtel settings
  const [paymentsLive, setPaymentsLive] = useState(false);
  const [mtnEnabled, setMtnEnabled] = useState(true);
  const [airtelEnabled, setAirtelEnabled] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (sectionData: Partial<PlatformSettings>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      const data = await response.json();
      setSettings(data.settings);
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sections = [
    { id: 'commission', label: 'Commission & Payouts', icon: Shield },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'branding', label: 'Platform Branding', icon: Palette },
    { id: 'localization', label: 'Localization', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
                  : 'bg-white/50 text-gray-700 hover:bg-white/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Commission & Payouts Section */}
      {activeSection === 'commission' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Commission & Payout Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Global Commission Rate (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.globalCommissionPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    globalCommissionPercentage: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                Default commission rate for all vendors (can be overridden per vendor)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Automatic Payout Processing
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, payouts run automatically based on schedule
                  </p>
                </div>
                <Switch
                  checked={settings.payoutAutomationEnabled}
                  onChange={(checked) =>
                    setSettings({ ...settings, payoutAutomationEnabled: checked })
                  }
                />
              </div>
            </div>

            {settings.payoutAutomationEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Schedule
                </label>
                <select
                  value={settings.payoutSchedule}
                  onChange={(e) =>
                    setSettings({ ...settings, payoutSchedule: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Payout Amount (RWF)
              </label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={settings.minimumPayoutAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minimumPayoutAmount: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                Vendors must have at least this balance to receive payout
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() =>
                handleSaveSection({
                  globalCommissionPercentage: settings.globalCommissionPercentage,
                  payoutAutomationEnabled: settings.payoutAutomationEnabled,
                  payoutSchedule: settings.payoutSchedule,
                  minimumPayoutAmount: settings.minimumPayoutAmount,
                })
              }
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Payment Methods Section */}
      {activeSection === 'payments' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods Configuration</h2>
          <div className="space-y-6">
            {/* Payment Mode Toggle */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Processing Mode</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {paymentsLive ? '🔴 Live Mode - Real transactions' : '🧪 Sandbox Mode - Test transactions'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sandbox</span>
                  <Switch checked={paymentsLive} onChange={setPaymentsLive} />
                  <span className="text-sm font-medium text-gray-700">Live</span>
                </div>
              </div>
              {paymentsLive && (
                <p className="text-sm text-red-600 mt-2">
                 ⚠️ Warning: Live mode will process real payments. Ensure API credentials are configured.
                </p>
              )}
            </div>

            {/* Cash on Delivery */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                  <p className="text-sm text-gray-600">Always enabled</p>
                </div>
                <Switch checked={true} disabled onChange={() => {}} />
              </div>
            </div>

            {/* MTN Mobile Money */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">MTN Mobile Money</h3>
                  <p className="text-sm text-gray-600">MTN MoMo payment integration</p>
                </div>
                <Switch checked={mtnEnabled} onChange={setMtnEnabled} />
              </div>

              {mtnEnabled && paymentsLive && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <Input placeholder="MTN API URL" defaultValue="https://sandbox.momodeveloper.mtn.com" />
                  <Input type="password" placeholder="API Key" />
                  <Input type="password" placeholder="API Secret" />
                  <Input type="password" placeholder="Subscription Key" />
                </div>
              )}
            </div>

            {/* Airtel Money */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Airtel Money</h3>
                  <p className="text-sm text-gray-600">Airtel Money payment integration</p>
                </div>
                <Switch checked={airtelEnabled} onChange={setAirtelEnabled} />
              </div>

              {airtelEnabled && paymentsLive && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <Input placeholder="Airtel API URL" defaultValue="https://openapiuat.airtel.africa" />
                  <Input type="password" placeholder="API Key" />
                  <Input type="password" placeholder="API Secret" />
                  <Input type="password" placeholder="Client ID" />
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={() => handleSaveSection({ acceptedPaymentMethods: settings.acceptedPaymentMethods })}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
              Save Payment Settings
            </Button>
          </div>
        </Card>
      )}

      {/* Branding Section */}
      {activeSection === 'branding' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Platform Branding</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <Input
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <Input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.platformLogo && (
                  <img src={settings.platformLogo} alt="Logo" className="h-16 w-16 object-contain" />
                )}
                <Button variant="secondary">Upload New Logo</Button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Recommended: PNG or SVG, max 500KB</p>
            </div>

            <Button
              variant="primary"
              onClick={() =>
                handleSaveSection({
                  platformName: settings.platformName,
                  supportEmail: settings.supportEmail,
                })
              }
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
              Save Branding
            </Button>
          </div>
        </Card>
      )}

      {/* Localization Section */}
      {activeSection === 'localization' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Localization Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Language
              </label>
              <select
                value={settings.locale}
                onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
                <option value="fr" disabled>
                  Français (Coming Soon)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <Input value={settings.timezone} disabled />
              <p className="text-sm text-gray-500 mt-1">All timestamps use this timezone</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <Input value="RWF (Rwandan Franc)" disabled />
              <p className="text-sm text-gray-500 mt-1">Multi-currency support coming soon</p>
            </div>

            <Button
              variant="primary"
              onClick={() => handleSaveSection({ locale: settings.locale })}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
              Save Localization
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}