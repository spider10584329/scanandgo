// SAFE: Test script to verify MariaDB connection (READ-ONLY)
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection (read-only)...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Check what tables exist (read-only)
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log('Available tables:', tables)
    
    // Test role table access (read-only)
    try {
      const roleCount = await prisma.role.count()
      console.log(`Roles table: ${roleCount} roles found`)
    } catch (error) {
      console.log('Could not access role table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Test users table access (read-only)  
    try {
      const userCount = await prisma.user.count()
      console.log(`Users table: ${userCount} users found`)
    } catch (error) {
      console.log('Could not access user table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function runConnectionTest() {
  console.log('SAFE DATABASE CONNECTION TEST (Read-Only)')
  console.log('═'.repeat(50))
  
  try {
    const success = await testDatabaseConnection()
    
    if (success) {
      console.log('Database connection test completed successfully!')
      console.log('Your database is ready for safe operations.')
    } else {
      console.log('Database connection test failed.')
      console.log('Check your database configuration and try again.')
    }
    
  } catch (error) {
    console.error('Test script error:', error)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Make sure MariaDB is running on localhost:3306')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('Database "scanandgo_prod" does not exist. Restore your backup first.')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Access denied. Check your database credentials in .env file.')
    }
    
    process.exit(1)
  }
}

runConnectionTest()
  .catch((e) => {
    console.error('Test script error:', e)
    process.exit(1)
  })
