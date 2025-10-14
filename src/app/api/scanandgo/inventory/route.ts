import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Array of 30 valid API keys (UUIDs)
const VALID_API_KEYS = [
  'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
  'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
  'd4e5f6g7-h8i9-0123-4567-890123defghi',
  'e5f6g7h8-i9j0-1234-5678-901234efghij',
  'f6g7h8i9-j0k1-2345-6789-012345fghijk',
  'g7h8i9j0-k1l2-3456-7890-123456ghijkl',
  'h8i9j0k1-l2m3-4567-8901-234567hijklm',
  'i9j0k1l2-m3n4-5678-9012-345678ijklmn',
  'j0k1l2m3-n4o5-6789-0123-456789jklmno',
  'k1l2m3n4-o5p6-7890-1234-567890klmnop',
  'l2m3n4o5-p6q7-8901-2345-678901lmnopq',
  'm3n4o5p6-q7r8-9012-3456-789012mnopqr',
  'n4o5p6q7-r8s9-0123-4567-890123nopqrs',
  'o5p6q7r8-s9t0-1234-5678-901234opqrst',
  'p6q7r8s9-t0u1-2345-6789-012345pqrstu',
  'q7r8s9t0-u1v2-3456-7890-123456qrstuv',
  'r8s9t0u1-v2w3-4567-8901-234567rstuvw',
  's9t0u1v2-w3x4-5678-9012-345678stuvwx',
  't0u1v2w3-x4y5-6789-0123-456789tuvwxy',
  'u1v2w3x4-y5z6-7890-1234-567890uvwxyz',
  'v2w3x4y5-z6a7-8901-2345-678901vwxyza',
  'w3x4y5z6-a7b8-9012-3456-789012wxyzab',
  'x4y5z6a7-b8c9-0123-4567-890123xyzabc',
  'y5z6a7b8-c9d0-1234-5678-901234yzabcd',
  'z6a7b8c9-d0e1-2345-6789-012345zabcde',
  'a7b8c9d0-e1f2-3456-7890-123456abcdef',
  'b8c9d0e1-f2g3-4567-8901-234567bcdefg',
  'c9d0e1f2-g3h4-5678-9012-345678cdefgh',
  'd0e1f2g3-h4i5-6789-0123-456789defghi'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customer_id = searchParams.get('customer_id')
    const apikey = searchParams.get('apikey')

    // Validate required parameters
    if (!customer_id || !apikey) {
      return NextResponse.json({
        success: false,
        message: 'customer_id and apikey parameters are required'
      }, { status: 400 })
    }

    // Validate API key
    if (!VALID_API_KEYS.includes(apikey)) {
      return NextResponse.json(null, { status: 401 })
    }

    // Convert customer_id to number
    const customerIdNumber = parseInt(customer_id)
    if (isNaN(customerIdNumber)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid customer_id format'
      }, { status: 400 })
    }

    // Fetch inventory data with related data for name resolution
    const inventories = await prisma.inventories.findMany({
      where: {
        customer_id: customerIdNumber
      },
      include: {
        categories: true,
        items: true,
        buildings: true,
        areas: true,
        floors: true,
        detail_locations: true,
        operators: true
      }
    })

    // Transform the data to include names instead of IDs
    const transformedInventories = inventories.map(inventory => ({
      id: inventory.id,
      customer_id: inventory.customer_id,
     // category_id: inventory.category_id,
      category_name: inventory.categories?.name || null,
      //item_id: inventory.item_id,
      item_name: inventory.items?.name || null,
     // building_id: inventory.building_id,
      building_name: inventory.buildings?.name || null,
     // area_id: inventory.area_id,
      area_name: inventory.areas?.name || null,
     // floor_id: inventory.floor_id,
      floor_name: inventory.floors?.name || null,
      // detail_location_id: inventory.detail_location_id,
      detail_location_name: inventory.detail_locations?.name || null,
      purchase_date: inventory.purchase_date,
      last_date: inventory.last_date,
      ref_client: inventory.ref_client,
      status: inventory.status,
      reg_date: inventory.reg_date,
      inv_date: inventory.inv_date,
      comment: inventory.comment,
      rfid: inventory.rfid,
      barcode: inventory.barcode,
      operator_id: inventory.operator_id,
      operator_name: inventory.operators?.username || null,
      room_assignment: inventory.room_assignment,
      category_df_immonet: inventory.category_df_immonet,
      purchase_amount: inventory.purchase_amount,
      is_throw: inventory.is_throw
    }))

    return NextResponse.json(transformedInventories)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      data: null
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
