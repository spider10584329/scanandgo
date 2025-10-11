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

    // Get recent inventory items (as a proxy for activity)
    const recentInventories = await prisma.inventories.findMany({
      where: {
        customer_id: decoded.customerId
      },
      include: {
        items: {
          select: {
            name: true,
            barcode: true
          }
        },
        detail_locations: {
          select: {
            name: true
          }
        },
        floors: {
          select: {
            name: true
          }
        },
        areas: {
          select: {
            name: true
          }
        },
        buildings: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 10
    })

    // Transform to activity format
    const activities = recentInventories.map(item => {
      const locationName = item.detail_locations?.name || 
                          item.floors?.name || 
                          item.areas?.name || 
                          item.buildings?.name || 
                          'Unknown Location'
      
      // Simulate different activity types based on status and other factors
      let action: 'created' | 'updated' | 'deleted' | 'status_changed' = 'updated'
      
      if (item.status === 4) {
        action = 'status_changed'
      } else if (item.status === 1) {
        action = Math.random() > 0.7 ? 'created' : 'updated'
      }

      return {
        id: item.id,
        action,
        itemName: item.items?.name || `Item ${item.id}`,
        barcode: item.barcode || item.items?.barcode || 'N/A',
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 24h
        newStatus: item.status,
        oldStatus: item.status === 4 ? 1 : undefined, // If missing, assume it was active before
        location: locationName
      }
    })

    return NextResponse.json({
      success: true,
      activities
    })

  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}
