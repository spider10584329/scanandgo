import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

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

    // Count items for the specific customer
    const count = await prisma.items.count({
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
    console.error('Database error while counting items:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch item count',
        count: 0,
        success: false 
      },
      { status: 500 }
    )
  }
}
