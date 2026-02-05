import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function truncateProducts() {
  console.log('🗑️  Truncating products table...\n')

  try {
    console.log('1️⃣ Initializing Payload...')
    const payload = await getPayload({ config })
    console.log('   ✓ Payload initialized\n')

    console.log('2️⃣ Getting database connection...')
    const db = payload.db as any
    const drizzle = db.drizzle
    
    if (!drizzle) {
      console.error('   ✗ Could not access database connection')
      process.exit(1)
    }
    console.log('   ✓ Database connection obtained\n')

    console.log('3️⃣ Truncating products table...')
    await drizzle.execute('TRUNCATE TABLE products CASCADE')
    console.log('   ✓ Products table truncated successfully\n')

    console.log('='.repeat(60))
    console.log('✅ Products table is now empty!')
    console.log('='.repeat(60))
    console.log('\nYou can now restart your dev server to push the schema.\n')

    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Error:', error?.message || error)
    if (error?.stack) {
      console.error('\nStack trace:')
      console.error(error.stack.split('\n').slice(0, 15).join('\n'))
    }
    process.exit(1)
  }
}

truncateProducts()
