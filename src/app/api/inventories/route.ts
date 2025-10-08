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
