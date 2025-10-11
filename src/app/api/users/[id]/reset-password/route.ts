import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyToken } from '@/lib/jwt'

const prisma = new PrismaClient()

// POST - Reset user password
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Generate new temporary password (could be customized)
    const tempPassword = `temp${Date.now().toString().slice(-6)}`
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update the user with new password and reset password request flag
    const updatedUser = await prisma.operators.update({
      where: {
        id: userId
      },
      data: {
        password: hashedPassword,
        isPasswordRequest: 0, // Reset the password request flag
        passwordRequest: null // Clear any password request details
      }
    })
    
    return NextResponse.json({ 
      user: updatedUser,
      tempPassword, // In production, this should be sent via email instead
      success: true,
      message: `Password reset successfully. Temporary password: ${tempPassword}`
    })
  } catch (error) {
    console.error('Database error while resetting password:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
