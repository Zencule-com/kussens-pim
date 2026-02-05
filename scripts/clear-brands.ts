import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function clearBrands() {
  const payload = await getPayload({ config })

  console.log('Fetching all brands...')
  
  const allBrands = await payload.find({
    collection: 'merken',
    limit: 1000, // Genoeg voor alle merken
  })

  console.log(`Found ${allBrands.docs.length} brands to delete`)

  let deletedCount = 0
  let errorCount = 0

  for (const brand of allBrands.docs) {
    try {
      await payload.delete({
        collection: 'merken',
        id: brand.id,
      })
      deletedCount++
      console.log(`✓ Deleted brand "${brand.merknaam}"`)
    } catch (error) {
      errorCount++
      console.error(`✗ Error deleting brand "${brand.merknaam}":`, error)
    }
  }

  console.log('\n=== Deletion Summary ===')
  console.log(`Total brands: ${allBrands.docs.length}`)
  console.log(`Successfully deleted: ${deletedCount}`)
  console.log(`Errors: ${errorCount}`)

  process.exit(0)
}

// Run deletion
clearBrands().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
