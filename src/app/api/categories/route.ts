import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

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
    const { name } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required', success: false },
        { status: 400 }
      )
    }

    // Check if category already exists for this customer
    const existingCategory = await prisma.categories.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim()
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists', success: false },
        { status: 409 }
      )
    }

    // Create new category
    const newCategory = await prisma.categories.create({
      data: {
        customer_id: decoded.customerId,
        name: name.trim()
      }
    })
    
    return NextResponse.json({ 
      category: newCategory,
      success: true,
      message: 'Category created successfully'
    })
  } catch (error) {
    console.error('Database error while creating category:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create category',
        success: false 
      },
      { status: 500 }
    )
  }
}

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

    // Get categories for the customer
    const categories = await prisma.categories.findMany({
      where: {
        customer_id: decoded.customerId
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json({ 
      categories,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching categories:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        categories: [],
        success: false 
      },
      { status: 500 }
    )
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
        { error: 'Category ID is required', success: false },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to customer
    const existingCategory = await prisma.categories.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if category has items
    const itemCount = await prisma.items.count({
      where: {
        category_id: parseInt(id)
      }
    })

    if (itemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It contains ${itemCount} item(s).`, success: false },
        { status: 409 }
      )
    }

    // Delete the category
    await prisma.categories.delete({
      where: {
        id: parseInt(id)
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting category:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete category',
        success: false 
      },
      { status: 500 }
    )
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
    const { id, name } = await request.json()
    
    if (!id || !name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category ID and name are required', success: false },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to customer
    const existingCategory = await prisma.categories.findFirst({
      where: {
        id: parseInt(id),
        customer_id: decoded.customerId
      }
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if new name already exists for this customer (excluding current category)
    const duplicateCategory = await prisma.categories.findFirst({
      where: {
        customer_id: decoded.customerId,
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Category name already exists', success: false },
        { status: 409 }
      )
    }

    // Update the category
    const updatedCategory = await prisma.categories.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name: name.trim()
      }
    })
    
    return NextResponse.json({ 
      category: updatedCategory,
      success: true,
      message: 'Category updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating category:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update category',
        success: false 
      },
      { status: 500 }
    )
  }
}
