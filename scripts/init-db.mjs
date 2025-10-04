import { initializeDatabase } from '../src/lib/database.js'

async function init() {
  console.log('🛡️  SAFE DATABASE INITIALIZATION (Data Only)')
  console.log('═'.repeat(50))
  console.log('ℹ️  This will only add missing data, not modify table structure')
  console.log('')
  
  try {
    await initializeDatabase()
    console.log('')
    console.log('🎉 Database initialization completed successfully!')
    console.log('📝 Default admin credentials (if created):')
    console.log('   📧 Email: admin@scanandgo.com')
    console.log('   🔑 Password: admin123')
    console.log('')
    console.log('✅ Your existing database structure was preserved!')
    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Database initialization failed:', error)
    console.error('💡 Make sure your database is restored and accessible.')
    process.exit(1)
  }
}

init()
