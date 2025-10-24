import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get vendor
    const vendor = await prisma.vendor.findUnique({
      where: { authId: user.id }
    })

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Get period parameter
    const period = request.nextUrl.searchParams.get('period') || 'today'

    if (!['today', 'week', 'month'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter. Must be: today, week, or month' },
        { status: 400 }
      )
    }

    // Calculate date range based on period
    let startDate: Date
    const now = new Date()

    if (period === 'today') {
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
    } else { // month
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }

    // Fetch orders for the period
    const orders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: startDate }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Helper function to format date based on period
    const formatDate = (date: Date, period: string): string => {
      if (period === 'today') {
        // Format as hour (12-hour format with AM/PM)
        const hour = date.getHours()
        if (hour === 0) return '12 AM'
        if (hour < 12) return `${hour} AM`
        if (hour === 12) return '12 PM'
        return `${hour - 12} PM`
      } else if (period === 'week') {
        // Format as weekday short name
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      } else {
        // Format as "Jan 1"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    }

    // Helper function to generate all time periods for the range
    const generateTimePeriods = (period: string): string[] => {
      if (period === 'today') {
        // Generate hours from 0 to current hour
        const currentHour = now.getHours()
        const hours: string[] = []
        for (let i = 0; i <= currentHour; i++) {
          const date = new Date()
          date.setHours(i, 0, 0, 0)
          hours.push(formatDate(date, 'today'))
        }
        return hours
      } else if (period === 'week') {
        // Generate last 7 days
        const days: string[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          days.push(formatDate(date, 'week'))
        }
        return days
      } else {
        // Generate last 30 days
        const days: string[] = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          days.push(formatDate(date, 'month'))
        }
        return days
      }
    }

    // Aggregate sales data
    const salesMap = new Map<string, number>()
    const ordersMap = new Map<string, number>()

    orders.forEach(order => {
      const dateKey = formatDate(new Date(order.createdAt), period)

      // Aggregate sales
      salesMap.set(dateKey, (salesMap.get(dateKey) || 0) + order.total)

      // Aggregate order count
      ordersMap.set(dateKey, (ordersMap.get(dateKey) || 0) + 1)
    })

    // Generate all time periods and fill with 0 if no data
    const allPeriods = generateTimePeriods(period)
    const salesData = allPeriods.map(period => ({
      date: period,
      value: salesMap.get(period) || 0
    }))

    const ordersData = allPeriods.map(period => ({
      date: period,
      count: ordersMap.get(period) || 0
    }))

    // Calculate popular items
    const itemsMap = new Map<string, {
      id: string
      name: string
      nameRw: string | null
      orderCount: number
      revenue: number
      imageUrl: string | null
    }>()

    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemsMap.get(item.menuItemId)
        if (existing) {
          existing.orderCount += item.quantity
          existing.revenue += item.subtotal
        } else {
          itemsMap.set(item.menuItemId, {
            id: item.menuItemId,
            name: item.name,
            nameRw: item.nameRw,
            orderCount: item.quantity,
            revenue: item.subtotal,
            imageUrl: item.menuItem.imageUrl
          })
        }
      })
    })

    // Convert to array, sort by order count, take top 5
    const popularItems = Array.from(itemsMap.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)

    return NextResponse.json({
      salesData,
      ordersData,
      popularItems
    })

  } catch (error: any) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
