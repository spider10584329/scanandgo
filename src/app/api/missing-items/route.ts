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

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause for search
    const whereClause: any = {
      customer_id: decoded.customerId
    }

    if (search.trim()) {
      whereClause.barcode = {
        contains: search.trim()
      }
    }

    // Get missing items for the customer
    const [missingItems, total] = await Promise.all([
      prisma.missing_items.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          id: 'desc'
        }
      }),
      prisma.missing_items.count({
        where: whereClause
      })
    ])

    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({ 
      missingItems,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      success: true
    })
  } catch (error) {
    console.error('Database error while fetching missing items:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch missing items',
        missingItems: [],
        success: false 
      },
      { status: 500 }
    )
  } finally {
    // Note: Don't disconnect shared prisma instance
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

    // Parse request body
    const body = await request.json()
    const { barcode, detail_location_id } = body

    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required', success: false },
        { status: 400 }
      )
    }

    // Create missing item record - detail_location_id is required
    if (!detail_location_id) {
      return NextResponse.json(
        { error: 'detail_location_id is required', success: false },
        { status: 400 }
      )
    }

    const missingItem = await prisma.missing_items.create({
      data: {
        customer_id: decoded.customerId,
        barcode: barcode,
        detail_location_id: detail_location_id
      }
    })

    return NextResponse.json({
      success: true,
      missingItem
    })

  } catch (error) {
    console.error('Database error while creating missing item:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create missing item',
        success: false 
      },
      { status: 500 }
    )
  } finally {
    // Note: Don't disconnect shared prisma instance
  }
}
