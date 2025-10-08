import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    // Extract and verify token
    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    // Get query parameters for location filtering
    const { searchParams } = new URL(request.url)
    const buildingId = searchParams.get('building_id')
    const areaId = searchParams.get('area_id')
    const floorId = searchParams.get('floor_id')
    const detailLocationId = searchParams.get('detail_location_id')

    // Build where clause
    const whereClause: { 
      customer_id: number; 
      building_id?: number; 
      area_id?: number; 
      floor_id?: number; 
      detail_location_id?: number 
    } = {
      customer_id: decoded.customerId
    }

    if (buildingId) {
      whereClause.building_id = parseInt(buildingId)
    }
    if (areaId) {
      whereClause.area_id = parseInt(areaId)
    }
    if (floorId) {
      whereClause.floor_id = parseInt(floorId)
    }
    if (detailLocationId) {
      whereClause.detail_location_id = parseInt(detailLocationId)
    }

    // Get inventory items for the customer
    const inventories = await prisma.inventories.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        buildings: {
          select: {
            id: true,
            name: true
          }
        },
        areas: {
          select: {
            id: true,
            name: true
          }
        },
        floors: {
          select: {
            id: true,
            name: true
          }
        },
        detail_locations: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    })
    
    return NextResponse.json({ 
      inventories,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching inventories:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventories',
        inventories: [],
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    // Extract and verify token
    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { items, locationData } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required', success: false },
        { status: 400 }
      )
    }

    // Get current date for records
    const currentDate = new Date().toISOString().split('T')[0]

    // Create inventory records for each item
    const inventoryRecords = items.map((item: { id: number; category_id?: number }) => ({
      customer_id: decoded.customerId,
      item_id: item.id,
      category_id: item.category_id || null,
      building_id: locationData?.buildingId || null,
      area_id: locationData?.areaId || null,
      floor_id: locationData?.floorId || null,
      detail_location_id: locationData?.detailLocationId || null,
      reg_date: currentDate,
      inv_date: currentDate,
      status: 1, // Default active status
      // Other fields will be null/empty by default
    }))

    // Insert all records
    const createdInventories = await prisma.inventories.createMany({
      data: inventoryRecords,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdInventories.count} inventory records`,
      createdCount: createdInventories.count
    })

  } catch (error) {
    console.error('Database error while creating inventory records:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create inventory records',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
