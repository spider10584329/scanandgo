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
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        }
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Handle missing items logic - comprehensive synchronization
    const oldStatus = existingItem.status || 0  // Default to Inactive if null
    const newStatus = status !== undefined ? parseInt(status) : oldStatus
    const oldBarcode = existingItem.barcode || existingItem.items?.barcode
    const newBarcode = barcode || oldBarcode
    const barcodeChanged = oldBarcode !== newBarcode
    
    console.log('Missing items synchronization check:', {
      inventoryId,
      oldStatus,
      newStatus,
      oldBarcode,
      newBarcode,
      barcodeChanged,
      statusFromBody: status,
      statusComparison: {
        isChangingToMissing: newStatus === 4 && oldStatus !== 4,
        isChangingFromMissing: oldStatus === 4 && newStatus !== 4,
        stayingMissing: oldStatus === 4 && newStatus === 4
      }
    })
    
    // Update the inventory item first
    const updatedItem = await prisma.inventories.update({
      where: { id: inventoryId },
      data: {
        purchase_date: purchase_date || null,
        last_date: last_date || null,
        ref_client: ref_client || null,
        status: newStatus,
        reg_date: reg_date || null,
        inv_date: inv_date || null,
        comment: comment || null,
        rfid: rfid || null,
        barcode: barcode || null,
        room_assignment: room_assignment || null,
        purchase_amount: purchase_amount !== undefined ? purchase_amount : null,
        is_throw: is_throw !== undefined ? is_throw : existingItem.is_throw
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
        }
      })

    // Handle missing_items table synchronization (comprehensive)
    // Status 4 = Missing, other statuses are: 1 = Active, 2 = Maintenance, 3 = Inactive, 0 = Inactive
    try {
      // Priority: inventory's own barcode first, then item's barcode, then the barcode from request body
      const finalBarcode = updatedItem.barcode || updatedItem.items?.barcode || barcode
      
      // Case 1: Barcode changed and item was in missing status - update missing_items record
      if (barcodeChanged && oldStatus === 4) {
        console.log('Barcode changed for missing item, updating missing_items record')
        
        // Remove old barcode record
        if (oldBarcode) {
          const deletedCount = await prisma.missing_items.deleteMany({
            where: {
              customer_id: decoded.customerId,
              barcode: oldBarcode
            }
          })
          console.log(`Removed ${deletedCount.count} old missing item records for barcode: ${oldBarcode}`)
        }
        
        // Add new barcode record if still missing status
        if (newStatus === 4 && finalBarcode) {
          let detailLocationId = updatedItem.detail_location_id
          
          if (!detailLocationId) {
            const defaultLocation = await prisma.detail_locations.findFirst({
              where: { customer_id: decoded.customerId }
            })
            detailLocationId = defaultLocation?.id || null
          }
          
          if (detailLocationId) {
            const newMissingItem = await prisma.missing_items.create({
              data: {
                customer_id: decoded.customerId,
                detail_location_id: detailLocationId,
                barcode: finalBarcode
              }
            })
            console.log(`Created new missing item record for updated barcode: ${finalBarcode}`)
          }
        }
      }
      
      // Case 2: Status changed to missing (and barcode didn't change, or was already handled above)
      else if (newStatus === 4 && oldStatus !== 4) {
        console.log('Item status changed to missing, adding to missing_items table')
        
        let detailLocationId = updatedItem.detail_location_id
        
        if (!detailLocationId) {
          const defaultLocation = await prisma.detail_locations.findFirst({
            where: { customer_id: decoded.customerId }
          })
          detailLocationId = defaultLocation?.id || null
        }
        
        if (finalBarcode && detailLocationId) {
          // Check if record already exists (shouldn't, but safety check)
          const existingMissingItem = await prisma.missing_items.findFirst({
            where: {
              customer_id: decoded.customerId,
              barcode: finalBarcode
            }
          })

          if (existingMissingItem) {
            // Update existing record
            await prisma.missing_items.update({
              where: {
                id: existingMissingItem.id
              },
              data: {
                detail_location_id: detailLocationId
              }
            })
            console.log('Updated existing missing item record')
          } else {
            // Create new record
            const newMissingItem = await prisma.missing_items.create({
              data: {
                customer_id: decoded.customerId,
                detail_location_id: detailLocationId,
                barcode: finalBarcode
              }
            })
            console.log('Created new missing item record:', newMissingItem)
          }
        } else {
          console.warn('Cannot create missing item record: missing barcode or location')
        }
      }
      
      // Case 3: Status changed from missing to something else
      else if (oldStatus === 4 && newStatus !== 4) {
        console.log('Item status changed from missing, removing from missing_items table')
        
        const barcodeToRemove = finalBarcode || oldBarcode
        
        if (barcodeToRemove) {
          const deletedCount = await prisma.missing_items.deleteMany({
            where: {
              customer_id: decoded.customerId,
              barcode: barcodeToRemove
            }
          })
          console.log(`Removed ${deletedCount.count} missing item records for barcode: ${barcodeToRemove}`)
        }
      }
      
      // Case 4: Item stays in missing status but other fields changed (location, etc.)
      else if (oldStatus === 4 && newStatus === 4 && !barcodeChanged) {
        console.log('Missing item updated, syncing location in missing_items table')
        
        if (finalBarcode) {
          let detailLocationId = updatedItem.detail_location_id
          
          if (!detailLocationId) {
            const defaultLocation = await prisma.detail_locations.findFirst({
              where: { customer_id: decoded.customerId }
            })
            detailLocationId = defaultLocation?.id || null
          }
          
          if (detailLocationId) {
            const updatedCount = await prisma.missing_items.updateMany({
              where: {
                customer_id: decoded.customerId,
                barcode: finalBarcode
              },
              data: {
                detail_location_id: detailLocationId
              }
            })
            console.log(`Updated ${updatedCount.count} missing item records with new location`)
          }
        }
      }
      
    } catch (missingItemError) {
      console.error('Error synchronizing missing_items table:', missingItemError)
      // Don't fail the request - inventory update succeeded
    }

    return NextResponse.json({
      success: true,
      inventory: updatedItem
    })

  } catch (error) {
    console.error('Error updating inventory item:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        error: 'Failed to update inventory item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    // Verify the inventory item belongs to the user's customer and get full details
    const existingItem = await prisma.inventories.findFirst({
      where: {
        id: inventoryId,
        customer_id: decoded.customerId
      },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        }
      }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Before deleting, remove any corresponding missing_items records
    try {
      const itemBarcode = existingItem.barcode || existingItem.items?.barcode
      
      if (itemBarcode) {
        const deletedCount = await prisma.missing_items.deleteMany({
          where: {
            customer_id: decoded.customerId,
            barcode: itemBarcode
          }
        })
        console.log(`Deleted inventory item - also removed ${deletedCount.count} missing item records for barcode: ${itemBarcode}`)
      }
    } catch (missingItemError) {
      console.error('Error removing missing item records during inventory deletion:', missingItemError)
      // Continue with inventory deletion even if missing_items cleanup fails
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
