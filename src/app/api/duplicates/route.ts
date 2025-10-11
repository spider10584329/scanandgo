import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

// Simple in-memory cache for duplicates (1 minute TTL for faster refresh)
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 1 * 60 * 1000 // 1 minute instead of 5

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}, CACHE_TTL) // Clean up every minute

// GET - Fetch duplicate inventory records (optimized)
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check for cache bypass header first
    const bypassCache = request.headers.get('cache-control')?.includes('no-cache') || 
                       request.headers.get('pragma') === 'no-cache'
    
    // Check cache only if not explicitly bypassed
    const cacheKey = `duplicates_${decoded.customerId}`
    const cached = cache.get(cacheKey)
    const now = Date.now()
    
    if (!bypassCache && cached && (now - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        duplicates: cached.data
      })
    }


    
    // Test basic inventory access first
    const inventoryCount = await prisma.inventories.count({
      where: {
        customer_id: decoded.customerId
      }
    })
    

    
    // First, get duplicate barcodes using a simpler approach
    const duplicateBarcodes = await prisma.inventories.groupBy({
      by: ['barcode'],
      where: {
        customer_id: decoded.customerId,
        AND: [
          { barcode: { not: null } },
          { barcode: { not: '' } }
        ]
      },
      having: {
        barcode: {
          _count: {
            gt: 1
          }
        }
      }
    })



    if (duplicateBarcodes.length === 0) {
      // Cache empty result
      cache.set(cacheKey, {
        data: [],
        timestamp: now
      })
      
      return NextResponse.json({
        success: true,
        duplicates: []
      })
    }

    const duplicateBarcodesList = duplicateBarcodes
      .map(g => g.barcode)
      .filter((barcode): barcode is string => barcode !== null && barcode !== '')



    // Find all inventory items with duplicate barcodes
    const duplicateInventories = await prisma.inventories.findMany({
      where: {
        customer_id: decoded.customerId,
        barcode: {
          in: duplicateBarcodesList
        }
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
        },
        operators: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { barcode: 'asc' },
        { id: 'asc' }
      ]
    })



    // Cache the results
    cache.set(cacheKey, {
      data: duplicateInventories,
      timestamp: now
    })

    return NextResponse.json({
      success: true,
      duplicates: duplicateInventories
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error fetching duplicate inventories:', error)
    
    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Detailed error:', errorMessage)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch duplicate inventories',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear cache for duplicates
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Clear cache for this customer
    const cacheKey = `duplicates_${decoded.customerId}`
    cache.delete(cacheKey)
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
