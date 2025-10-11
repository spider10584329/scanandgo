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

    // Get search query
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        results: [],
        success: true
      })
    }

    const searchTerm = query.trim()

    // Search across inventory records
    const results = await prisma.inventories.findMany({
      where: {
        customer_id: decoded.customerId,
        OR: [
          {
            barcode: {
              contains: searchTerm
            }
          },
          {
            items: {
              name: {
                contains: searchTerm
              }
            }
          },
          {
            items: {
              barcode: {
                contains: searchTerm
              }
            }
          }
        ]
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        buildings: {
          select: {
            id: true,
            name: true
          }
        },
        areas: {
          select: {
            id: true,
            name: true
          }
        },
        floors: {
          select: {
            id: true,
            name: true
          }
        },
        detail_locations: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { inv_date: 'desc' },
        { id: 'desc' }
      ],
      take: limit
    })

    // Format results for display
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedResults = results.map((item: any) => ({
      id: item.id,
      itemName: item.items?.name || 'Unknown Item',
      barcode: item.barcode || item.items?.barcode || 'No Barcode',
      location: [
        item.buildings?.name,
        item.areas?.name,
        item.floors?.name,
        item.detail_locations?.name
      ].filter(Boolean).join(' / ') || 'No Location',
      status: item.status === 1 ? 'Active' : item.status === 2 ? 'Maintenance' : item.status === 3 ? 'Inactive' : item.status === 4 ? 'Missing' : 'Unknown',
      statusColor: item.status === 1 ? 'green' : item.status === 2 ? 'yellow' : item.status === 3 ? 'red' : item.status === 4 ? 'purple' : 'gray',
      isThrow: item.is_throw ? 'Yes' : 'No',
      deploymentDate: item.inv_date ? new Date(item.inv_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : '-',
      category: item.categories?.name || 'Uncategorized'
    }))

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length,
      query: searchTerm,
      success: true
    })

  } catch (error) {
    console.error('Database error during search:', error)
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        results: [],
        success: false 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
