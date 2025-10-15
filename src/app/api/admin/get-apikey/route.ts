import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No authentication token provided' },
        { status: 401 }
      )
    }

    // Verify token and check if user is admin
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Use customer_id from the verified token
    const customerId = payload.customerId

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'Customer ID not found in token' },
        { status: 400 }
      )
    }

    try {
      // Check if an API key exists for this customer_id
      const existingKey = await prisma.$queryRaw<Array<{api_key: string}>>`
        SELECT api_key FROM apikey WHERE customer_id = ${customerId} LIMIT 1
      `

      if (existingKey.length > 0) {
        return NextResponse.json({
          success: true,
          apiKey: existingKey[0].api_key,
          exists: true
        })
      } else {
        return NextResponse.json({
          success: true,
          apiKey: null,
          exists: false
        })
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database operation failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Get API key error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
