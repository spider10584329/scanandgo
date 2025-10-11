import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get status counts for the customer
    const inventories = await prisma.inventories.findMany({
      where: {
        customer_id: decoded.customerId
      },
      select: {
        status: true
      }
    })

    // Count items by status
    const statusCounts: Record<number, number> = {}
    let total = 0

    inventories.forEach(item => {
      const status = item.status || 0 // Default to Inactive if null
      statusCounts[status] = (statusCounts[status] || 0) + 1
      total++
    })

    return NextResponse.json({
      success: true,
      statusCounts,
      total
    })

  } catch (error) {
    console.error('Error fetching status summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status summary' },
      { status: 500 }
    )
  }
}
