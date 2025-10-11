// Test missing items with correct schema
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })
const prisma = new PrismaClient()

async function testMissingItemsCreation() {
  try {
    // Get first detail location
    const location = await prisma.detail_locations.findFirst()
    console.log('Using location:', location)

    if (!location) {
      console.log('No detail locations found')
      return
    }

    // Try creating a missing item
    const missingItem = await prisma.missing_items.create({
      data: {
        customer_id: location.customer_id,
        detail_location_id: location.id,
        barcode: 'TEST-BARCODE-123'
      }
    })
    console.log('Created missing item:', missingItem)

    // Clean up - delete the test item
    await prisma.missing_items.delete({
      where: { id: missingItem.id }
    })
    console.log('Test item cleaned up')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMissingItemsCreation()
