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

    const buildings = await prisma.buildings.findMany({
      where: {
        customer_id: decoded.customerId
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({ 
      buildings,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching buildings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch buildings',
        buildings: [],
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

    const { name } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Building name is required', success: false },
        { status: 400 }
      )
    }

    // Check if building already exists for this customer
    const existingBuilding = await prisma.buildings.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim()
      }
    })

    if (existingBuilding) {
      return NextResponse.json(
        { error: 'Building name already exists', success: false },
        { status: 409 }
      )
    }

    const newBuilding = await prisma.buildings.create({
      data: {
        customer_id: decoded.customerId,
        name: name.trim()
      }
    })
    
    return NextResponse.json({ 
      building: newBuilding,
      success: true,
      message: 'Building created successfully'
    })
  } catch (error) {
    console.error('Database error while creating building:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create building',
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

    const { id, name } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Building ID and name are required', success: false },
        { status: 400 }
      )
    }

    // Check if building exists and belongs to customer
    const existingBuilding = await prisma.buildings.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingBuilding) {
      return NextResponse.json(
        { error: 'Building not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if new name already exists (excluding current building)
    const duplicateBuilding = await prisma.buildings.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateBuilding) {
      return NextResponse.json(
        { error: 'Building name already exists', success: false },
        { status: 409 }
      )
    }

    const updatedBuilding = await prisma.buildings.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim()
      }
    })
    
    return NextResponse.json({ 
      building: updatedBuilding,
      success: true,
      message: 'Building updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating building:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update building',
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
        { error: 'Building ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if building exists and belongs to customer
    const existingBuilding = await prisma.buildings.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingBuilding) {
      return NextResponse.json(
        { error: 'Building not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if building has areas
    const areasCount = await prisma.areas.count({
      where: {
        building_id: parseInt(id)
      }
    })

    if (areasCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete building that contains areas', success: false },
        { status: 409 }
      )
    }

    await prisma.buildings.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Building deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting building:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete building',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
