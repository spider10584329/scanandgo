import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

// GET - Get specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', success: false },
        { status: 400 }
      )
    }

    // Get the user
    const user = await prisma.operators.findFirst({
      where: {
        id: userId,
        customer_id: decoded.customerId
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', success: false },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      user,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', success: false },
        { status: 400 }
      )
    }

    const { isActive, isPasswordRequest, password } = await request.json()

    // Check if user exists and belongs to customer
    const existingUser = await prisma.operators.findFirst({
      where: {
        id: userId,
        customer_id: decoded.customerId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    
    if (isPasswordRequest !== undefined) {
      updateData.isPasswordRequest = isPasswordRequest
    }
    
    // If password is provided, hash it and update
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password.trim(), 10)
      updateData.password = hashedPassword
      // Reset password request status when password is changed
      updateData.isPasswordRequest = 0
    }

    // Update the user
    const updatedUser = await prisma.operators.update({
      where: {
        id: userId
      },
      data: updateData
    })
    
    return NextResponse.json({ 
      user: updatedUser,
      success: true,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Database error while updating user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID', success: false },
        { status: 400 }
      )
    }

    // Check if user exists and belongs to customer
    const existingUser = await prisma.operators.findFirst({
      where: {
        id: userId,
        customer_id: decoded.customerId
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found or access denied', success: false },
        { status: 404 }
      )
    }

    // Check if user has associated inventories
    const inventoryCount = await prisma.inventories.count({
      where: {
        operator_id: userId
      }
    })

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with associated inventory records', success: false },
        { status: 409 }
      )
    }

    // Delete the user
    await prisma.operators.delete({
      where: {
        id: userId
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Database error while deleting user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
