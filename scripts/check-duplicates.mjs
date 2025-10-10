import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: 'environment-config.env' })

const prisma = new PrismaClient()

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate barcodes in the inventory...')
    
    // Get total inventory count
    const totalCount = await prisma.inventories.count()
    console.log(`📊 Total inventory records: ${totalCount}`)
    
    // Check for non-null barcodes
    const nonNullBarcodes = await prisma.inventories.count({
      where: {
        barcode: { not: null }
      }
    })
    console.log(`📋 Records with non-null barcodes: ${nonNullBarcodes}`)
    
    // Check for non-empty barcodes
    const nonEmptyBarcodes = await prisma.inventories.count({
      where: {
        AND: [
          { barcode: { not: null } },
          { barcode: { not: '' } }
        ]
      }
    })
    console.log(`📝 Records with non-empty barcodes: ${nonEmptyBarcodes}`)
    
    // Get sample barcodes
    const sampleBarcodes = await prisma.inventories.findMany({
      where: {
        AND: [
          { barcode: { not: null } },
          { barcode: { not: '' } }
        ]
      },
      select: {
        id: true,
        barcode: true,
        customer_id: true
      },
      take: 10
    })
    console.log('📋 Sample barcodes:', sampleBarcodes)
    
    // Find duplicate barcodes using groupBy
    const duplicateBarcodes = await prisma.inventories.groupBy({
      by: ['barcode'],
      where: {
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
      },
      _count: {
        barcode: true
      }
    })
    
    console.log(`🔍 Duplicate barcodes found: ${duplicateBarcodes.length}`)
    console.log('Duplicate barcode details:', duplicateBarcodes)
    
    // For each duplicate barcode, show the actual records
    for (const dupBarcode of duplicateBarcodes) {
      console.log(`\n📦 Barcode "${dupBarcode.barcode}" appears ${dupBarcode._count.barcode} times:`)
      
      const records = await prisma.inventories.findMany({
        where: {
          barcode: dupBarcode.barcode
        },
        select: {
          id: true,
          barcode: true,
          customer_id: true,
          items: {
            select: {
              name: true
            }
          }
        }
      })
      
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}, Customer: ${record.customer_id}, Item: ${record.items?.name || 'Unknown'}`)
      })
    }
    
    // Check customer distribution
    const customerStats = await prisma.inventories.groupBy({
      by: ['customer_id'],
      _count: {
        id: true
      }
    })
    
    console.log('\n👥 Customer distribution:')
    customerStats.forEach(stat => {
      console.log(`  Customer ${stat.customer_id}: ${stat._count.id} records`)
    })
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicates()
