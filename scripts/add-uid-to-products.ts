import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function addUidColumn() {
  console.log('🔧 Adding uid column to products table...\n')

  const payload = await getPayload({ config })

  try {
    // Check if there are existing products
    const existingProducts = await payload.find({
      collection: 'products',
      limit: 1000,
    })

    console.log(`Found ${existingProducts.docs.length} existing products`)

    if (existingProducts.docs.length > 0) {
      console.log('\n⚠️  WARNING: There are existing products without uid!')
      console.log('You need to manually add uid values or delete existing products first.')
      console.log('\nTo fix this, you can either:')
      console.log('1. Delete all products: DELETE FROM products;')
      console.log('2. Or manually add uid values to existing products')
      process.exit(1)
    }

    console.log('\n✓ No existing products found. The uid column will be created automatically when you create the first product.')
    console.log('Or you can run this SQL manually:')
    console.log('\nALTER TABLE products ADD COLUMN IF NOT EXISTS uid TEXT;')
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS products_uid_key ON products(uid);\n')

    process.exit(0)
  } catch (error: any) {
    console.error('Error:', error?.message || error)
    process.exit(1)
  }
}

addUidColumn()
