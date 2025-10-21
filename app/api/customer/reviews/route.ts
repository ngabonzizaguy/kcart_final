import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for review creation
const createReviewSchema = z.object({
  vendorId: z.string().uuid(),
  customerName: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = createReviewSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: data.vendorId },
      select: { id: true },
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 400 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        vendorId: data.vendorId,
        customerName: data.customerName,
        rating: data.rating,
        comment: data.comment,
      },
    })

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review.id,
          customerName: review.customerName,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    )
  }
}