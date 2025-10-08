import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n')

    // Check buildings
    const buildings = await prisma.buildings.findMany()
    console.log(`📦 Buildings: ${buildings.length} records`)
    buildings.forEach(b => console.log(`  - ID: ${b.id}, Name: ${b.name}, Customer ID: ${b.customer_id}`))

    // Check categories
    const categories = await prisma.categories.findMany()
    console.log(`\n🏷️  Categories: ${categories.length} records`)
    categories.forEach(c => console.log(`  - ID: ${c.id}, Name: ${c.name}, Customer ID: ${c.customer_id}`))

    // Check items
    const items = await prisma.items.findMany()
    console.log(`\n📋 Items: ${items.length} records`)
    items.forEach(i => console.log(`  - ID: ${i.id}, Name: ${i.name}, Customer ID: ${i.customer_id}, Category ID: ${i.category_id}`))

    // Check users (to understand customer_id values)
    const users = await prisma.users.findMany()
    console.log(`\n👥 Users: ${users.length} records`)
    users.forEach(u => console.log(`  - ID: ${u.id}, Username: ${u.username}, Role: ${u.role}`))

    // Check areas
    const areas = await prisma.areas.findMany()
    console.log(`\n🏢 Areas: ${areas.length} records`)
    areas.forEach(a => console.log(`  - ID: ${a.id}, Name: ${a.name}, Customer ID: ${a.customer_id}, Building ID: ${a.building_id}`))

    // Check operators
    const operators = await prisma.operators.findMany()
    console.log(`\n👮 Operators: ${operators.length} records`)
    operators.forEach(o => console.log(`  - ID: ${o.id}, Username: ${o.username}, Customer ID: ${o.customer_id}, Active: ${o.isActive}`))

    // Check inventories
    const inventories = await prisma.inventories.findMany()
    console.log(`\n📊 Inventories: ${inventories.length} records`)
    inventories.slice(0, 5).forEach(i => console.log(`  - ID: ${i.id}, Customer ID: ${i.customer_id}, Item ID: ${i.item_id}, Category ID: ${i.category_id}`))
    if (inventories.length > 5) console.log(`  ... and ${inventories.length - 5} more`)

  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
