import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: Record<string, unknown> = {
      customer_id: decoded.customerId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { date: { contains: search } }
      ]
    }

    // Get total count
    const totalCount = await prisma.snapshots.count({
      where: whereClause
    })

    // Get snapshots with pagination
    const snapshots = await prisma.snapshots.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      snapshots,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching snapshots:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, date } = body

    if (!name || !date) {
      return NextResponse.json({ success: false, error: 'Name and date are required' }, { status: 400 })
    }

    const snapshot = await prisma.snapshots.create({
      data: {
        customer_id: decoded.customerId,
        name,
        date
      }
    })

    return NextResponse.json({
      success: true,
      snapshot
    })

  } catch (error) {
    console.error('Error creating snapshot:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
