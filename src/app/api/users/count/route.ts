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

    // Count operators for different statuses
    // Normal: isActive = 1 AND isPasswordRequest = 0
    const normalCount = await prisma.operators.count({
      where: {
        customer_id: decoded.customerId,
        isActive: 1,
        isPasswordRequest: 0
      }
    })

    // Forgotten Password: isActive = 1 AND isPasswordRequest = 1
    const forgottenPasswordCount = await prisma.operators.count({
      where: {
        customer_id: decoded.customerId,
        isActive: 1,
        isPasswordRequest: 1
      }
    })

    // Inactive: isActive = 0 AND isPasswordRequest = 1
    const inactiveCount = await prisma.operators.count({
      where: {
        customer_id: decoded.customerId,
        isActive: 0,
        isPasswordRequest: 1
      }
    })
    
    return NextResponse.json({ 
      normal: normalCount,
      forgottenPassword: forgottenPasswordCount,
      inactive: inactiveCount,
      success: true,
      customerId: decoded.customerId
    })
  } catch (error) {
    console.error('Database error while counting users:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user counts',
        normal: 0,
        forgottenPassword: 0,
        inactive: 0,
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
