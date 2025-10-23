'use client'

import { useState } from 'react'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Utensils, CreditCard, ExternalLink, Share2 } from 'lucide-react'
import PaymentSettingsModal from '@/components/modals/PaymentSettingsModal'
import ShareStoreModal from '@/components/modals/ShareStoreModal'

interface QuickActionsSectionProps {
  vendorSlug: string
}

export default function QuickActionsSection({ vendorSlug }: QuickActionsSectionProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const storefrontUrl = typeof window !== 'undefined'
    ? `${window.location.host}/${vendorSlug}`
    : `deligo.app/${vendorSlug}`

  return (
    <>
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Manage Menu */}
              <a
                href="/dashboard/menu"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-orange-200 transition-all hover:shadow-md"
              >
                <Utensils className="w-6 h-6 text-orange-600" />
                <p className="font-medium text-gray-900 text-sm text-center">Manage Menu</p>
              </a>

              {/* Payment Settings */}
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-orange-200 transition-all hover:shadow-md"
              >
                <CreditCard className="w-6 h-6 text-orange-600" />
                <p className="font-medium text-gray-900 text-sm text-center">Payment Settings</p>
              </button>

              {/* View Storefront */}
              <a
                href={`/${vendorSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-orange-200 transition-all hover:shadow-md"
              >
                <ExternalLink className="w-6 h-6 text-orange-600" />
                <p className="font-medium text-gray-900 text-sm text-center">View Storefront</p>
              </a>

              {/* Share Store */}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-orange-200 transition-all hover:shadow-md"
              >
                <Share2 className="w-6 h-6 text-orange-600" />
                <p className="font-medium text-gray-900 text-sm text-center">Share Store</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Modals */}
      <PaymentSettingsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <ShareStoreModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        storefrontUrl={storefrontUrl}
        vendorSlug={vendorSlug}
      />
    </>
  )
}