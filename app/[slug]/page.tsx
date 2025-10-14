import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import { MapPin, Phone, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

export default async function StorefrontPage({
  params,
}: {
  params: { slug: string }
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug: params.slug },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!vendor) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-warm pb-20">
      {/* Cover Image */}
      {vendor.coverUrl && (
        <div className="relative h-48 md:h-64 w-full">
          <Image
            src={vendor.coverUrl}
            alt={vendor.businessName}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Vendor Header */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Offline Badge - Subtle */}
        {!vendor.isOnline && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Currently Offline</span>
          </div>
        )}

        <Card className="mb-6">
          <div className="flex items-start gap-4">
            {vendor.logoUrl && (
              <Image
                src={vendor.logoUrl}
                alt={vendor.businessName}
                width={80}
                height={80}
                className="rounded-xl"
              />
            )}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {vendor.businessName}
              </h1>
              {vendor.description && (
                <p className="text-gray-600 mt-2">{vendor.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {vendor.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{vendor.businessPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Menu - Single Column List */}
        <div className="space-y-8">
          {vendor.categories.map((category: typeof vendor.categories[number]) => (
            <section key={category.id}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              <div className="space-y-4">
                {category.menuItems.map((item) => (
                  <Card key={item.id} hover padding="md">
                    <div className="flex gap-4">
                      {item.imageUrl && (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xl font-bold text-primary-600">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {category.menuItems.length === 0 && (
                <Card>
                  <p className="text-center text-gray-500 py-8">
                    Menu coming soon...
                  </p>
                </Card>
              )}
            </section>
          ))}

          {vendor.categories.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-12">
                Menu coming soon...
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Action Button - Add to Cart */}
      {vendor.isOnline && vendor.categories.some(cat => cat.menuItems.length > 0) && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            className="w-14 h-14 bg-gradient-orange text-white rounded-full shadow-warm hover:shadow-lg transform hover:scale-110 transition-all duration-200 flex items-center justify-center"
            aria-label="View Cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
