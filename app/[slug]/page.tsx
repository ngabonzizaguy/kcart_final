import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import { MapPin, Phone, Clock } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-warm">
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
      <div className="max-w-6xl mx-auto px-4 py-6">
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
                {!vendor.isOnline && (
                  <div className="px-3 py-1 bg-gray-200 rounded-full text-gray-700 font-medium">
                    Currently Offline
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Menu */}
        <div className="space-y-8">
          {vendor.categories.map((category) => (
            <section key={category.id}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.menuItems.map((item) => (
                  <Card key={item.id} hover>
                    {item.imageUrl && (
                      <div className="relative h-40 w-full mb-4 rounded-xl overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(item.price)}
                        </span>
                        {vendor.isOnline && (
                          <button
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {category.menuItems.length === 0 && (
                <Card>
                  <p className="text-center text-gray-500 py-8">
                    No items available in this category yet
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
    </div>
  )
}
