import 'dotenv/config'
import { Pool } from 'pg'

async function fixProductsDatabase() {
  console.log('🔧 Fixing products database schema...\n')
  console.log('Starting script...')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found')
    process.exit(1)
  }

  console.log('DATABASE_URL found, creating connection...')

  let pool: Pool | null = null
  let client: any = null

  try {
    // Create direct database connection (bypass Payload)
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    console.log('Connecting to database...')
    client = await pool.connect()
    console.log('✓ Connected to database\n')

    console.log('1️⃣ Truncating products table...')
    await client.query('TRUNCATE TABLE products CASCADE')
    console.log('   ✓ Products table truncated\n')

    console.log('2️⃣ Converting category column to TEXT...')
    await client.query('ALTER TABLE products ALTER COLUMN category TYPE TEXT USING category::TEXT')
    console.log('   ✓ Category column converted to TEXT\n')

    console.log('3️⃣ Dropping old enum type...')
    await client.query('DROP TYPE IF EXISTS enum_products_category CASCADE')
    console.log('   ✓ Old enum type dropped\n')

    console.log('4️⃣ Adding uid column...')
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS uid TEXT')
    console.log('   ✓ UID column added\n')

    console.log('5️⃣ Creating unique index on uid...')
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS products_uid_key ON products(uid)')
    console.log('   ✓ Unique index created\n')

    console.log('='.repeat(60))
    console.log('✅ Database schema fixed successfully!')
    console.log('='.repeat(60))
    console.log('\nNext steps:')
    console.log('1. Restart your dev server')
    console.log('2. Payload will recreate the enum with new values')
    console.log('3. Run: npm run import:products\n')

    if (client) client.release()
    if (pool) await pool.end()
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Error:', error?.message || error)
    if (error?.code) {
      console.error('Error code:', error.code)
    }
    if (error?.stack) {
      console.error('\nStack trace:')
      console.error(error.stack.split('\n').slice(0, 20).join('\n'))
    }
    if (client) client.release()
    if (pool) await pool.end()
    process.exit(1)
  }
}

fixProductsDatabase()
