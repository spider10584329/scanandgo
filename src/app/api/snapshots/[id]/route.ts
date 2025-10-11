import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const snapshotId = parseInt(id)
    if (isNaN(snapshotId)) {
      return NextResponse.json({ success: false, error: 'Invalid snapshot ID' }, { status: 400 })
    }

    const snapshot = await prisma.snapshots.findFirst({
      where: {
        id: snapshotId,
        customer_id: decoded.customerId
      }
    })

    if (!snapshot) {
      return NextResponse.json({ success: false, error: 'Snapshot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      snapshot
    })

  } catch (error) {
    console.error('Error fetching snapshot:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const snapshotId = parseInt(id)
    if (isNaN(snapshotId)) {
      return NextResponse.json({ success: false, error: 'Invalid snapshot ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, date } = body

    if (!name || !date) {
      return NextResponse.json({ success: false, error: 'Name and date are required' }, { status: 400 })
    }

    // Check if snapshot exists and belongs to customer
    const existingSnapshot = await prisma.snapshots.findFirst({
      where: {
        id: snapshotId,
        customer_id: decoded.customerId
      }
    })

    if (!existingSnapshot) {
      return NextResponse.json({ success: false, error: 'Snapshot not found' }, { status: 404 })
    }

    const updatedSnapshot = await prisma.snapshots.update({
      where: { id: snapshotId },
      data: {
        name,
        date
      }
    })

    return NextResponse.json({
      success: true,
      snapshot: updatedSnapshot
    })

  } catch (error) {
    console.error('Error updating snapshot:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No authorization token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)
    
    if (!decoded || !decoded.customerId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const snapshotId = parseInt(id)
    if (isNaN(snapshotId)) {
      return NextResponse.json({ success: false, error: 'Invalid snapshot ID' }, { status: 400 })
    }

    // Check if snapshot exists and belongs to customer
    const existingSnapshot = await prisma.snapshots.findFirst({
      where: {
        id: snapshotId,
        customer_id: decoded.customerId
      }
    })

    if (!existingSnapshot) {
      return NextResponse.json({ success: false, error: 'Snapshot not found' }, { status: 404 })
    }

    await prisma.snapshots.delete({
      where: { id: snapshotId }
    })

    return NextResponse.json({
      success: true,
      message: 'Snapshot deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting snapshot:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
