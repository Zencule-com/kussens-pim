import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function clearProducts() {
  console.log('🗑️  Clearing all products...\n')

  const payload = await getPayload({ config })

  try {
    console.log('Fetching all products...')
    const { docs: productsToDelete } = await payload.find({
      collection: 'products',
      limit: 1000,
    })

    console.log(`Found ${productsToDelete.length} products to delete\n`)

    if (productsToDelete.length === 0) {
      console.log('✓ No products found. Nothing to delete.')
      process.exit(0)
    }

    let successCount = 0
    let errorCount = 0

    for (const product of productsToDelete) {
      try {
        await payload.delete({
          collection: 'products',
          id: product.id,
        })
        successCount++
        console.log(`✓ Deleted product "${product.name || product.id}"`)
      } catch (error: any) {
        errorCount++
        console.error(`✗ Error deleting product "${product.name || product.id}":`, error?.message || error)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 DELETION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total products: ${productsToDelete.length}`)
    console.log(`Successfully deleted: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log('='.repeat(60))

    process.exit(0)
  } catch (error: any) {
    console.error('Fatal error:', error?.message || error)
    process.exit(1)
  }
}

clearProducts()
