const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testUserAuth() {
  try {
    console.log('🔍 Testing user authentication...')
    
    // Look up the admin user
    const user = await prisma.users.findUnique({
      where: { username: 'admin@scanandgo.com' }
    })
    
    if (!user) {
      console.log('❌ Admin user not found!')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      username: user.username,
      roleId: user.role
    })
    
    // Get the role
    const role = await prisma.role.findUnique({
      where: { id: user.role }
    })
    
    console.log('🎭 Role found:', role)
    
    // Test password verification
    const testPassword = 'admin123'
    const isValidPassword = await bcrypt.compare(testPassword, user.password)
    
    console.log('🔐 Password test result:', {
      testPassword,
      isValid: isValidPassword
    })
    
    if (isValidPassword && role && role.name === 'admin') {
      console.log('✅ Authentication test PASSED - User should be able to sign in')
    } else {
      console.log('❌ Authentication test FAILED')
      console.log('Issues:')
      if (!isValidPassword) console.log('  - Password does not match')
      if (!role) console.log('  - Role not found')
      if (role && role.name !== 'admin') console.log(`  - Role is '${role.name}', expected 'admin'`)
    }
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUserAuth()
