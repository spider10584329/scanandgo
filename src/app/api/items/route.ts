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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    // Build where clause
    const whereClause: { customer_id: number; category_id?: number } = {
      customer_id: decoded.customerId
    }

    // Add category filter if provided
    if (categoryId) {
      whereClause.category_id = parseInt(categoryId)
    }

    // Get items for the customer with category information
    const items = await prisma.items.findMany({
      where: whereClause,
      include: {
        categories: {
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
      items,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching items:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch items',
        items: [],
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

    // Get request body
    const { name, barcode, category_id } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Item name is required', success: false },
        { status: 400 }
      )
    }

    if (!barcode || barcode.trim() === '') {
      return NextResponse.json(
        { error: 'Barcode is required', success: false },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Category is required', success: false },
        { status: 400 }
      )
    }

    // Verify category belongs to customer
    const category = await prisma.categories.findFirst({
      where: {
        id: parseInt(category_id),
        customer_id: decoded.customerId
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Invalid category', success: false },
        { status: 400 }
      )
    }

    // Check if barcode already exists for this customer (across all categories)
    const existingBarcode = await prisma.items.findFirst({
      where: {
        customer_id: decoded.customerId,
        barcode: barcode.trim()
      }
    })

    if (existingBarcode) {
      return NextResponse.json(
        { error: 'Barcode already exists', success: false },
        { status: 409 }
      )
    }

    // Create new item
    const newItem = await prisma.items.create({
      data: {
        customer_id: decoded.customerId,
        category_id: parseInt(category_id),
        name: name.trim(),
        barcode: barcode.trim()
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      item: newItem,
      success: true,
      message: 'Item created successfully'
    })
  } catch (error) {
    console.error('Database error while creating item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create item',
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

    // Get request body
    const { id, name, barcode, category_id } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Item ID and name are required', success: false },
        { status: 400 }
      )
    }

    if (!barcode || barcode.trim() === '') {
      return NextResponse.json(
        { error: 'Barcode is required', success: false },
        { status: 400 }
      )
    }

    // Check if item exists and belongs to customer
    const existingItem = await prisma.items.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found or access denied', success: false },
        { status: 404 }
      )
    }

    // If category_id is provided, verify it belongs to customer
    if (category_id) {
      const category = await prisma.categories.findFirst({
        where: {
          id: parseInt(category_id),
          customer_id: decoded.customerId
        }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category', success: false },
          { status: 400 }
        )
      }
    }

    // Check if barcode already exists for this customer (excluding current item)
    const duplicateBarcode = await prisma.items.findFirst({
      where: {
        customer_id: decoded.customerId,
        barcode: barcode.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateBarcode) {
      return NextResponse.json(
        { error: 'Barcode already exists', success: false },
        { status: 409 }
      )
    }

    // Update the item
    const updatedItem = await prisma.items.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim(),
        barcode: barcode.trim(),
        ...(category_id && { category_id: parseInt(category_id) })
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ 
      item: updatedItem,
      success: true,
      message: 'Item updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update item',
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

    // Get request body
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if item exists and belongs to customer
    const existingItem = await prisma.items.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Delete the item
    await prisma.items.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete item',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
