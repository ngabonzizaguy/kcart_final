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
      coverUrls: true,
      address: true,
      businessPhone: true,
      isOnline: true,
      deliveryFee: true,
      cuisineTags: true,
      categories: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameRw: true,
          description: true,
          sortOrder: true,
          menuItems: {
            orderBy: { sortOrder: 'asc' },
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
        orderBy: { createdAt: 'desc' },
        take: 10,
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