import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function clearFabrics() {
  const payload = await getPayload({ config })

  console.log('🗑️  Clearing all fabrics...\n')

  console.log('Fetching all fabrics...')
  const { docs: fabricsToDelete } = await payload.find({
    collection: 'stoffen',
    limit: 10000, // Verhoog limit als je meer stoffen hebt
  })

  console.log(`Found ${fabricsToDelete.length} fabrics to delete\n`)

  if (fabricsToDelete.length === 0) {
    console.log('No fabrics found to delete.')
    process.exit(0)
  }

  let successCount = 0
  let errorCount = 0

  for (const fabric of fabricsToDelete) {
    try {
      await payload.delete({
        collection: 'stoffen',
        id: fabric.id,
      })
      successCount++
      console.log(`✓ Deleted fabric "${fabric.naam}"`)
    } catch (error: any) {
      errorCount++
      console.error(`✗ Error deleting fabric "${fabric.naam}":`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 DELETION SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total fabrics: ${fabricsToDelete.length}`)
  console.log(`Successfully deleted: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

clearFabrics().catch((error: any) => {
  console.error('Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
