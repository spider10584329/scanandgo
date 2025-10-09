import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

// PATCH - Move inventory items to a new location
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { inventoryIds, locationData } = body

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return NextResponse.json({ error: 'No inventory items provided' }, { status: 400 })
    }

    if (!locationData || !locationData.buildingId || !locationData.areaId || !locationData.floorId || !locationData.detailLocationId) {
      return NextResponse.json({ error: 'Complete location data required' }, { status: 400 })
    }

    // Verify all inventory items belong to the user's customer
    const existingItems = await prisma.inventories.findMany({
      where: {
        id: { in: inventoryIds },
        customer_id: decoded.customerId
      }
    })

    if (existingItems.length !== inventoryIds.length) {
      return NextResponse.json({ error: 'Some inventory items not found or access denied' }, { status: 404 })
    }

    // Update all inventory items with new location
    const updatedItems = await prisma.inventories.updateMany({
      where: {
        id: { in: inventoryIds },
        customer_id: decoded.customerId
      },
      data: {
        building_id: locationData.buildingId,
        area_id: locationData.areaId,
        floor_id: locationData.floorId,
        detail_location_id: locationData.detailLocationId
      }
    })

    return NextResponse.json({
      success: true,
      updatedCount: updatedItems.count,
      message: `Successfully moved ${updatedItems.count} inventory items`
    })

  } catch (error) {
    console.error('Error moving inventory items:', error)
    return NextResponse.json(
      { error: 'Failed to move inventory items' },
      { status: 500 }
    )
  }
}
