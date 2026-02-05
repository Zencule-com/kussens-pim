import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lees het JSON bestand
const vullingenDataPath = join(homedir(), 'Downloads/Filling/Filling.json')

interface VullingData {
  title: string
  description: string
  pricePerUnit: number
  products: string // String zoals "{rug-schuin,rechthoekig,rond}"
  id: number
}

// Parse products string naar array
function parseProducts(productsString: string): string[] {
  if (!productsString) return []
  return productsString
    .replace(/[{}]/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

async function importVullingen() {
  console.log('🚀 Starting vullingen import...\n')

  let payload
  try {
    console.log('1️⃣ Initializing Payload...')
    payload = await getPayload({ config })
    console.log('   ✓ Payload initialized successfully\n')
  } catch (error: any) {
    console.error('   ✗ Error initializing Payload:', error?.message || error)
    process.exit(1)
  }

  // Lees JSON bestand
  console.log('2️⃣ Loading JSON file...')
  let vullingenData: VullingData[]

  try {
    vullingenData = JSON.parse(readFileSync(vullingenDataPath, 'utf-8'))
    console.log(`   ✓ Loaded ${vullingenData.length} vullingen\n`)
  } catch (error: any) {
    console.error(`   ✗ Error parsing JSON: ${error.message}`)
    process.exit(1)
  }

  console.log('3️⃣ Starting import...\n')

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const vulling of vullingenData) {
    try {
      // Check of vulling al bestaat
      const existing = await payload.find({
        collection: 'vullingen',
        where: {
          title: {
            equals: vulling.title,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Vulling "${vulling.title}" already exists, skipping`)
        continue
      }

      // Maak vulling aan
      await payload.create({
        collection: 'vullingen',
        data: {
          title: vulling.title,
          description: vulling.description || '',
          pricePerUnit: vulling.pricePerUnit,
        },
      })

      successCount++
      console.log(`✓ Created vulling "${vulling.title}"`)
    } catch (error: any) {
      errorCount++
      console.error(`✗ Error creating vulling "${vulling.title}":`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total vullingen: ${vullingenData.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

importVullingen().catch((error: any) => {
  console.error('\n❌ Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
