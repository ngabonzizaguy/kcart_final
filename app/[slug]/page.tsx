import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StorefrontClient from './StorefrontClient'

interface StorefrontPageProps {
  params: {
    slug: string
  }
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = params

  // Fetch vendor with categories and menu items
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      businessName: true,
      businessNameRw: true,
      description: true,
      descriptionRw: true,
      logoUrl: true,
      coverUrl: true,
      address: true,
      businessPhone: true,
      isOnline: true,
      deliveryFee: true,
      cuisineTags: true,
      categories: {
        orderBy: {
          sortOrder: 'asc',
        },
        select: {
          id: true,
          name: true,
          nameRw: true,
          description: true,
          sortOrder: true,
          menuItems: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            select: {
              id: true,
              name: true,
              nameRw: true,
              description: true,
              descriptionRw: true,
              price: true,
              imageUrl: true,
              isAvailable: true,
            },
          },
        },
      },
      reviews: {
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          customerName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  })

  if (!vendor) {
    notFound()
  }

  return <StorefrontClient vendor={vendor} />
}