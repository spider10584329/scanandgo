import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('area_id')

    // Build where clause
    const where: any = {
      customer_id: decoded.customerId
    }

    // Filter by area_id if provided
    if (areaId) {
      where.area_id = parseInt(areaId)
    }

    const floors = await prisma.floors.findMany({
      where,
      include: {
        areas: {
          select: {
            id: true,
            name: true,
            buildings: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({ 
      floors,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching floors:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch floors',
        floors: [],
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
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    const { name, area_id } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Floor name is required', success: false },
        { status: 400 }
      )
    }

    if (!area_id) {
      return NextResponse.json(
        { error: 'Area is required', success: false },
        { status: 400 }
      )
    }

    // Verify area belongs to customer
    const area = await prisma.areas.findFirst({
      where: {
        id: parseInt(area_id),
        customer_id: decoded.customerId
      }
    })

    if (!area) {
      return NextResponse.json(
        { error: 'Invalid area', success: false },
        { status: 400 }
      )
    }

    // Check if floor already exists for this customer and area
    const existingFloor = await prisma.floors.findFirst({
      where: {
        customer_id: decoded.customerId,
        area_id: parseInt(area_id),
        name: name.trim()
      }
    })

    if (existingFloor) {
      return NextResponse.json(
        { error: 'Floor name already exists in this area', success: false },
        { status: 409 }
      )
    }

    const newFloor = await prisma.floors.create({
      data: {
        customer_id: decoded.customerId,
        area_id: parseInt(area_id),
        name: name.trim()
      },
      include: {
        areas: {
          select: {
            id: true,
            name: true,
            buildings: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({ 
      floor: newFloor,
      success: true,
      message: 'Floor created successfully'
    })
  } catch (error) {
    console.error('Database error while creating floor:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create floor',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    const { id, name, area_id } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Floor ID and name are required', success: false },
        { status: 400 }
      )
    }

    // Check if floor exists and belongs to customer
    const existingFloor = await prisma.floors.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingFloor) {
      return NextResponse.json(
        { error: 'Floor not found or access denied', success: false },
        { status: 404 }
      )
    }

    // If area_id is provided, verify it belongs to customer
    if (area_id) {
      const area = await prisma.areas.findFirst({
        where: {
          id: parseInt(area_id),
          customer_id: decoded.customerId
        }
      })

      if (!area) {
        return NextResponse.json(
          { error: 'Invalid area', success: false },
          { status: 400 }
        )
      }
    }

    // Check if new name already exists for this customer and area (excluding current floor)
    const duplicateFloor = await prisma.floors.findFirst({
      where: {
        customer_id: decoded.customerId,
        area_id: area_id ? parseInt(area_id) : existingFloor.area_id,
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateFloor) {
      return NextResponse.json(
        { error: 'Floor name already exists in this area', success: false },
        { status: 409 }
      )
    }

    const updatedFloor = await prisma.floors.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim(),
        ...(area_id && { area_id: parseInt(area_id) })
      },
      include: {
        areas: {
          select: {
            id: true,
            name: true,
            buildings: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({ 
      floor: updatedFloor,
      success: true,
      message: 'Floor updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating floor:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update floor',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required', success: false },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Floor ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if floor exists and belongs to customer
    const existingFloor = await prisma.floors.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingFloor) {
      return NextResponse.json(
        { error: 'Floor not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if floor has detail locations
    const detailLocationsCount = await prisma.detail_locations.count({
      where: {
        floor_id: parseInt(id)
      }
    })

    if (detailLocationsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete floor that contains detail locations', success: false },
        { status: 409 }
      )
    }

    await prisma.floors.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Floor deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting floor:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete floor',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
