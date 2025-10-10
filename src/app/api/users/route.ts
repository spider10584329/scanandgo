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

    // Get all operators for this customer
    const operators = await prisma.operators.findMany({
      where: {
        customer_id: decoded.customerId
      },
      orderBy: {
        username: 'asc'
      }
    })
    
    return NextResponse.json({ 
      users: operators,
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching users:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        users: [],
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
