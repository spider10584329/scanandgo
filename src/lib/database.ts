import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function initializeDatabase() {
  try {   
    // Test basic connection
    await prisma.$connect()
    
    // Test tables access
    try {
      await prisma.inventories.count()
    } catch (error) {
      console.error('Could not access inventories table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      await prisma.items.count()
    } catch (error) {
      console.error('Could not access items table:', error instanceof Error ? error.message : 'Unknown error')
    }

    // Create test operator (agent) if doesn't exist
    try {
      const existingOperator = await prisma.operators.findFirst({
        where: { username: 'agent1' }
      })
      
      if (!existingOperator) {
        const hashedPassword = await bcrypt.hash('password123', 12)
        
        await prisma.operators.create({
          data: {
            customer_id: 1,
            username: 'agent1',
            password: hashedPassword,
            isActive: 1
          }
        })
      }
    } catch (error) {
      console.error('Could not create test operator:', error instanceof Error ? error.message : 'Unknown error')
    }
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
    // Test basic connection
    await prisma.$connect()
    
    // Check what tables exist (read-only)
    await prisma.$queryRaw`SHOW TABLES`
    
    // Test main tables access (read-only)
    try {
      await prisma.inventories.count()
    } catch (error) {
      console.error('Could not access inventories table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    try {
      await prisma.items.count()
    } catch (error) {
      console.error('Could not access items table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
