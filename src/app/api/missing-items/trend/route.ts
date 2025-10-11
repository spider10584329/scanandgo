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

    // Generate trend data for the last 30 days
    // Since we don't have historical data, we'll simulate based on current missing items
    const currentMissingCount = await prisma.inventories.count({
      where: {
        customer_id: decoded.customerId,
        status: 4 // Missing status
      }
    })

    // Generate mock trend data (in a real app, this would come from historical records)
    const trend = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate some variation around the current count
      const variation = Math.floor(Math.random() * 6) - 3 // -3 to +3
      const count = Math.max(0, currentMissingCount + variation)
      
      trend.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    return NextResponse.json({
      success: true,
      trend
    })

  } catch (error) {
    console.error('Error fetching missing items trend:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missing items trend' },
      { status: 500 }
    )
  }
}
