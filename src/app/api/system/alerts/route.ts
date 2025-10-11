import { NextRequest, NextResponse } from 'next/server'
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

    // Generate sample alerts for the dashboard
    const alerts = [
      {
        id: '1',
        type: 'warning',
        title: 'High Missing Items',
        message: '2 items have been missing for over 7 days',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionable: true,
        actionUrl: '/admin/missing'
      },
      {
        id: '2',
        type: 'info',
        title: 'Inventory Updated',
        message: 'Recent inventory changes detected',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        actionable: true,
        actionUrl: '/admin/inventory'
      },
      {
        id: '3',
        type: 'success',
        title: 'System Running Smoothly',
        message: 'All inventory tracking systems operational',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actionable: false
      }
    ]

    return NextResponse.json({
      success: true,
      alerts
    })

  } catch (error) {
    console.error('Error fetching system alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system alerts' },
      { status: 500 }
    )
  }
}
