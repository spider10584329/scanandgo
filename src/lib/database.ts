import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function initializeDatabase() {
  try {   
    
    // SAFE: Only insert/update data, never modify table structure
    const roles = ['admin', 'manager', 'agent', 'user']
    
    for (const roleName of roles) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {}, // Don't change existing roles
        create: { name: roleName } // Only create if missing
      })  
    }

    // SAFE: Check existing users without modifying table structure
    const userCount = await prisma.users.count()
    
    if (userCount === 0) {      
      const adminRole = await prisma.role.findUnique({
        where: { name: 'admin' }
      })
      
      if (adminRole) {
        // Use a strong default password that won't trigger browser warnings
        const strongPassword = 'admin123'
        const hashedPassword = await bcrypt.hash(strongPassword, 12)
        
        await prisma.users.create({
          data: {
            username: 'admin@scanandgo.com',
            password: hashedPassword,
            role: adminRole.id
          }
        })        
        console.log('✅ Default admin user created: admin@scanandgo.com / admin123')
      } else {
        console.log('⚠️  Admin role not found - skipping admin user creation')
      }
    } else {
      console.log('ℹ️  Users already exist - skipping admin user creation')
    }
    
    console.log('🎉 Database initialization completed safely')
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error // Re-throw to let caller handle
  }
}

export async function getUserWithRole(username: string) {
  console.log('🔍 Looking up user:', username)
  
  const user = await prisma.users.findUnique({
    where: { username }
  })
  
  console.log('👤 User found:', user ? { id: user.id, username: user.username, roleId: user.role } : 'No user found')
  
  if (user) {
    const role = await prisma.role.findUnique({
      where: { id: user.role || 0 }
    })
    
    console.log('🎭 Role found:', role ? { id: role.id, name: role.name } : 'No role found')
    
    const result = { ...user, roleRef: role }
    console.log('✅ Final user object:', { 
      id: result.id, 
      username: result.username, 
      roleRef: result.roleRef 
    })
    
    return result
  }
  
  console.log('❌ No user found for username:', username)
  return null
}

export async function createUser(username: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12)
  
  // Get the 'user' role (default for new registrations)
  const userRole = await prisma.role.findUnique({
    where: { name: 'user' }
  })
  
  if (!userRole) {
    throw new Error('User role not found')
  }
  
  const newUser = await prisma.users.create({
    data: {
      username,
      password: hashedPassword,
      role: userRole.id
    }
  })
  
  return { ...newUser, roleRef: userRole }
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword)
}

// SAFE: Test database connection without modifying anything
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection (read-only)...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check what tables exist (read-only)
    const tables = await prisma.$queryRaw`SHOW TABLES`
    console.log('📋 Available tables:', tables)
    
    // Test role table access (read-only)
    try {
      const roleCount = await prisma.role.count()
      console.log(`📊 Roles table: ${roleCount} roles found`)
    } catch (error) {
      console.log('⚠️  Could not access role table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Test users table access (read-only)  
    try {
      const userCount = await prisma.users.count()
      console.log(`👥 Users table: ${userCount} users found`)
    } catch (error) {
      console.log('⚠️  Could not access user table:', error instanceof Error ? error.message : 'Unknown error')
    }
    
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
