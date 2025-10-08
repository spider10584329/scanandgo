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
    const floorId = searchParams.get('floor_id')

    // Build where clause
    const whereClause: { customer_id: number; floor_id?: number } = {
      customer_id: decoded.customerId
    }

    if (floorId) {
      whereClause.floor_id = parseInt(floorId)
    }

    const detailLocations = await prisma.detail_locations.findMany({
      where: whereClause,
      include: {
        floors: {
          select: {
            id: true,
            name: true,
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
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({ 
      detailLocations,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching detail locations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch detail locations',
        detailLocations: [],
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

    const { name, floor_id, img_data } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Detail location name is required', success: false },
        { status: 400 }
      )
    }

    if (!floor_id) {
      return NextResponse.json(
        { error: 'Floor is required', success: false },
        { status: 400 }
      )
    }

    // Verify floor belongs to customer
    const floor = await prisma.floors.findFirst({
      where: {
        id: parseInt(floor_id),
        customer_id: decoded.customerId
      }
    })

    if (!floor) {
      return NextResponse.json(
        { error: 'Invalid floor', success: false },
        { status: 400 }
      )
    }

    // Check if detail location already exists for this customer and floor
    const existingDetailLocation = await prisma.detail_locations.findFirst({
      where: {
        customer_id: decoded.customerId,
        floor_id: parseInt(floor_id),
        name: name.trim()
      }
    })

    if (existingDetailLocation) {
      return NextResponse.json(
        { error: 'Detail location name already exists in this floor', success: false },
        { status: 409 }
      )
    }

    const newDetailLocation = await prisma.detail_locations.create({
      data: {
        customer_id: decoded.customerId,
        floor_id: parseInt(floor_id),
        name: name.trim(),
        img_data: img_data?.trim() || null
      },
      include: {
        floors: {
          select: {
            id: true,
            name: true,
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
        }
      }
    })
    
    return NextResponse.json({ 
      detailLocation: newDetailLocation,
      success: true,
      message: 'Detail location created successfully'
    })
  } catch (error) {
    console.error('Database error while creating detail location:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create detail location',
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

    const { id, name, floor_id, img_data } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Detail location ID and name are required', success: false },
        { status: 400 }
      )
    }

    // Check if detail location exists and belongs to customer
    const existingDetailLocation = await prisma.detail_locations.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingDetailLocation) {
      return NextResponse.json(
        { error: 'Detail location not found or access denied', success: false },
        { status: 404 }
      )
    }

    // If floor_id is provided, verify it belongs to customer
    if (floor_id) {
      const floor = await prisma.floors.findFirst({
        where: {
          id: parseInt(floor_id),
          customer_id: decoded.customerId
        }
      })

      if (!floor) {
        return NextResponse.json(
          { error: 'Invalid floor', success: false },
          { status: 400 }
        )
      }
    }

    // Check if new name already exists for this customer and floor (excluding current detail location)
    const duplicateDetailLocation = await prisma.detail_locations.findFirst({
      where: {
        customer_id: decoded.customerId,
        floor_id: floor_id ? parseInt(floor_id) : existingDetailLocation.floor_id,
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateDetailLocation) {
      return NextResponse.json(
        { error: 'Detail location name already exists in this floor', success: false },
        { status: 409 }
      )
    }

    const updatedDetailLocation = await prisma.detail_locations.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim(),
        img_data: img_data?.trim() || null,
        ...(floor_id && { floor_id: parseInt(floor_id) })
      },
      include: {
        floors: {
          select: {
            id: true,
            name: true,
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
        }
      }
    })
    
    return NextResponse.json({ 
      detailLocation: updatedDetailLocation,
      success: true,
      message: 'Detail location updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating detail location:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update detail location',
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
        { error: 'Detail location ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if detail location exists and belongs to customer
    const existingDetailLocation = await prisma.detail_locations.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingDetailLocation) {
      return NextResponse.json(
        { error: 'Detail location not found or access denied', success: false },
        { status: 404 }
      )
    }

    await prisma.detail_locations.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Detail location deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting detail location:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete detail location',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
