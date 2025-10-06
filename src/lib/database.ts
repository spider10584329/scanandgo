import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function initializeDatabase() {
  try {   
    console.log('Initializing database tables and basic data...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Test tables access
    try {
      const inventoryCount = await prisma.inventories.count()
      console.log(`Inventories table: ${inventoryCount} items found`)
    } catch (error) {
      console.log('Could not access inventories table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      const itemCount = await prisma.items.count()
      console.log(`Items table: ${itemCount} items found`)
    } catch (error) {
      console.log('Could not access items table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    console.log('Database initialization completed successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error // Re-throw to let caller handle
  } finally {
    await prisma.$disconnect()
  }
}

// SAFE: Test database connection without modifying anything
export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection (read-only)...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Check what tables exist (read-only)
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log('Available tables:', tables)
    
    // Test main tables access (read-only)
    try {
      const inventoryCount = await prisma.inventories.count()
      console.log(`Inventories table: ${inventoryCount} items found`)
    } catch (error) {
      console.log('Could not access inventories table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      const itemCount = await prisma.items.count()
      console.log(`Items table: ${itemCount} items found`)
    } catch (error) {
      console.log('Could not access items table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
