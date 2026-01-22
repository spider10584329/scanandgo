import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Convert customer_id to number
    const customerIdNumber = parseInt(customer_id)
    if (isNaN(customerIdNumber)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid customer_id format'
      }, { status: 400 })
    }

    // Validate API key against database
    try {
      console.log(`[DEBUG] Validating API key: ${apikey} for customer_id: ${customerIdNumber}`)
      
      // Check if the API key exists and belongs to the specified customer_id
      const apiKeyValidation = await prisma.$queryRaw<Array<{count: number}>>`
        SELECT COUNT(*) as count FROM apikey 
        WHERE api_key = ${apikey} AND customer_id = ${customerIdNumber}
      `
      
      console.log('[DEBUG] API key validation result:', apiKeyValidation)
      
      // Handle BigInt count properly - convert to number for comparison
      const count = apiKeyValidation?.[0]?.count ? Number(apiKeyValidation[0].count) : 0
      
      if (!apiKeyValidation || apiKeyValidation.length === 0 || count === 0) {
        console.log('[DEBUG] API key validation FAILED - unauthorized access')
        return NextResponse.json({
          success: false,
          message: 'The API key is invalid.'
        }, { status: 401 })
      }
      
      console.log('[DEBUG] API key validation PASSED')
    } catch (error) {
      console.error('[ERROR] API key validation database error:', error)
      // Always deny access if there's a database error
      return NextResponse.json({
        success: false,
        message: 'The API key is invalid.'
      }, { status: 401 })
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
  }
}
