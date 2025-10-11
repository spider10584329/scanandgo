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

    // Count categories for the specific customer
    const count = await prisma.categories.count({
      where: {
        customer_id: decoded.customerId
      }
    })
    

    
    return NextResponse.json({ 
      count,
      success: true,
      customerId: decoded.customerId
    })
  } catch (error) {
    console.error('Database error while counting categories:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch category count',
        count: 0,
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
