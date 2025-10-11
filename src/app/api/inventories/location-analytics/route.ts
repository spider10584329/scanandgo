import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

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

    // Get all locations with item counts (including locations with 0 items)
    const locationStats = await prisma.$queryRaw`
      SELECT 
        b.name as buildingName,
        a.name as areaName,
        f.name as floorName,
        dl.name as detailLocationName,
        COALESCE(location_items.totalItems, 0) as totalItems,
        COALESCE(location_items.missingItems, 0) as missingItems,
        COALESCE(location_items.percentage, 0) as percentage
      FROM detail_locations dl
      LEFT JOIN floors f ON dl.floor_id = f.id
      LEFT JOIN areas a ON f.area_id = a.id
      LEFT JOIN buildings b ON a.building_id = b.id
      LEFT JOIN (
        SELECT 
          i.detail_location_id,
          COUNT(*) as totalItems,
          SUM(CASE WHEN i.status = 4 THEN 1 ELSE 0 END) as missingItems,
          (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM inventories WHERE customer_id = ${decoded.customerId}), 0)) as percentage
        FROM inventories i
        WHERE i.customer_id = ${decoded.customerId}
        GROUP BY i.detail_location_id
      ) location_items ON dl.id = location_items.detail_location_id
      WHERE b.customer_id = ${decoded.customerId}
      ORDER BY COALESCE(location_items.totalItems, 0) DESC, b.name, a.name, f.name, dl.name
    ` as Record<string, unknown>[]

    const locations = locationStats.map(stat => {
      // Build complete location path
      const locationParts = []
      if (stat.buildingName) locationParts.push(stat.buildingName)
      if (stat.areaName) locationParts.push(stat.areaName)
      if (stat.floorName) locationParts.push(stat.floorName)
      if (stat.detailLocationName) locationParts.push(stat.detailLocationName)
      
      const fullLocationName = locationParts.length > 0 ? locationParts.join(' > ') : 'Unknown Location'
      
      return {
        locationName: fullLocationName,
        buildingName: stat.buildingName || '',
        areaName: stat.areaName || '',
        floorName: stat.floorName || '',
        detailLocationName: stat.detailLocationName || '',
        totalItems: Number(stat.totalItems),
        missingItems: Number(stat.missingItems),
        percentage: parseFloat(Number(stat.percentage).toFixed(1))
      }
    })

    return NextResponse.json({
      success: true,
      locations
    })

  } catch (error) {
    console.error('Error fetching location analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location analytics' },
      { status: 500 }
    )
  }
}
