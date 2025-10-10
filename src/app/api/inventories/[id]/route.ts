import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

// PATCH - Update inventory item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const inventoryId = parseInt(resolvedParams.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid inventory ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      purchase_date,
      last_date,
      ref_client,
      status,
      reg_date,
      inv_date,
      comment,
      rfid,
      barcode,
      room_assignment,
      purchase_amount,
      is_throw
    } = body

    // Verify the inventory item belongs to the user's customer
    const existingItem = await prisma.inventories.findFirst({
      where: {
        id: inventoryId,
        customer_id: decoded.customerId
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Update the inventory item
    const updatedItem = await prisma.inventories.update({
      where: { id: inventoryId },
      data: {
        purchase_date: purchase_date || null,
        last_date: last_date || null,
        ref_client: ref_client || null,
        status: status !== undefined ? status : null,
        reg_date: reg_date || null,
        inv_date: inv_date || null,
        comment: comment || null,
        rfid: rfid || null,
        barcode: barcode || null,
        room_assignment: room_assignment || null,
        purchase_amount: purchase_amount !== undefined ? purchase_amount : null,
        is_throw: is_throw !== undefined ? is_throw : false
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      inventory: updatedItem
    })

  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const inventoryId = parseInt(resolvedParams.id)
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'Invalid inventory ID' }, { status: 400 })
    }

    // Verify the inventory item belongs to the user's customer
    const existingItem = await prisma.inventories.findFirst({
      where: {
        id: inventoryId,
        customer_id: decoded.customerId
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Delete the inventory item
    await prisma.inventories.delete({
      where: { id: inventoryId }
    })

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}
