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
    const buildingId = searchParams.get('building_id')

    // Build where clause
    const where: any = {
      customer_id: decoded.customerId
    }

    // Filter by building_id if provided
    if (buildingId) {
      where.building_id = parseInt(buildingId)
    }

    const areas = await prisma.areas.findMany({
      where,
      include: {
        buildings: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({ 
      areas,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching areas:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch areas',
        areas: [],
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

    const { name, building_id } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Area name is required', success: false },
        { status: 400 }
      )
    }

    if (!building_id) {
      return NextResponse.json(
        { error: 'Building is required', success: false },
        { status: 400 }
      )
    }

    // Verify building belongs to customer
    const building = await prisma.buildings.findFirst({
      where: {
        id: parseInt(building_id),
        customer_id: decoded.customerId
      }
    })

    if (!building) {
      return NextResponse.json(
        { error: 'Invalid building', success: false },
        { status: 400 }
      )
    }

    // Check if area already exists for this customer and building
    const existingArea = await prisma.areas.findFirst({
      where: {
        customer_id: decoded.customerId,
        building_id: parseInt(building_id),
        name: name.trim()
      }
    })

    if (existingArea) {
      return NextResponse.json(
        { error: 'Area name already exists in this building', success: false },
        { status: 409 }
      )
    }

    const newArea = await prisma.areas.create({
      data: {
        customer_id: decoded.customerId,
        building_id: parseInt(building_id),
        name: name.trim()
      },
      include: {
        buildings: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      area: newArea,
      success: true,
      message: 'Area created successfully'
    })
  } catch (error) {
    console.error('Database error while creating area:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create area',
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

    const { id, name, building_id } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Area ID and name are required', success: false },
        { status: 400 }
      )
    }

    // Check if area exists and belongs to customer
    const existingArea = await prisma.areas.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingArea) {
      return NextResponse.json(
        { error: 'Area not found or access denied', success: false },
        { status: 404 }
      )
    }

    // If building_id is provided, verify it belongs to customer
    if (building_id) {
      const building = await prisma.buildings.findFirst({
        where: {
          id: parseInt(building_id),
          customer_id: decoded.customerId
        }
      })

      if (!building) {
        return NextResponse.json(
          { error: 'Invalid building', success: false },
          { status: 400 }
        )
      }
    }

    // Check if new name already exists for this customer and building (excluding current area)
    const duplicateArea = await prisma.areas.findFirst({
      where: {
        customer_id: decoded.customerId,
        building_id: building_id ? parseInt(building_id) : existingArea.building_id,
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateArea) {
      return NextResponse.json(
        { error: 'Area name already exists in this building', success: false },
        { status: 409 }
      )
    }

    const updatedArea = await prisma.areas.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim(),
        ...(building_id && { building_id: parseInt(building_id) })
      },
      include: {
        buildings: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      area: updatedArea,
      success: true,
      message: 'Area updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating area:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update area',
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
        { error: 'Area ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if area exists and belongs to customer
    const existingArea = await prisma.areas.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingArea) {
      return NextResponse.json(
        { error: 'Area not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if area has floors
    const floorsCount = await prisma.floors.count({
      where: {
        area_id: parseInt(id)
      }
    })

    if (floorsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete area that contains floors', success: false },
        { status: 409 }
      )
    }

    await prisma.areas.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Area deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting area:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete area',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
