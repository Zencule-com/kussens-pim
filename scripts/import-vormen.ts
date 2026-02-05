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
const vormenDataPath = join(homedir(), 'Downloads/Product/ProductShape.json')

interface VormData {
  key: string
  name: string
  description: string
  defaultDims: string // JSON string
  modelPath: string
  category: string // "Zitkussen", "Rugkussen", "Kussen op maat", "Sierkussen", "Kussen op plank"
  fields: string // JSON string
  id: number
}

// Map category naar Payload category
function mapCategory(category: string): 'zitkussen' | 'rugkussen' | 'overig' {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('zit')) {
    return 'zitkussen'
  }
  if (categoryLower.includes('rug')) {
    return 'rugkussen'
  }
  return 'overig' // Kussen op maat, Sierkussen, Kussen op plank -> overig
}

async function importVormen() {
  console.log('🚀 Starting vormen import...\n')

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
  let vormenData: VormData[]

  try {
    vormenData = JSON.parse(readFileSync(vormenDataPath, 'utf-8'))
    console.log(`   ✓ Loaded ${vormenData.length} vormen\n`)
  } catch (error: any) {
    console.error(`   ✗ Error parsing JSON: ${error.message}`)
    process.exit(1)
  }

  console.log('3️⃣ Starting import...\n')

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const vorm of vormenData) {
    try {
      // Check of vorm al bestaat (op basis van key)
      const existing = await payload.find({
        collection: 'vormen',
        where: {
          key: {
            equals: vorm.key,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Vorm "${vorm.key}" already exists, skipping`)
        continue
      }

      // Map category
      const category = mapCategory(vorm.category)

      // Maak vorm aan
      await payload.create({
        collection: 'vormen',
        data: {
          key: vorm.key,
          naam: vorm.name,
          description: vorm.description || '',
          category: category,
          modelPath: vorm.modelPath || undefined,
        },
      })

      successCount++
      console.log(`✓ Created vorm "${vorm.key}" (${vorm.name}, category: ${category})`)
    } catch (error: any) {
      errorCount++
      console.error(`✗ Error creating vorm "${vorm.key}":`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total vormen: ${vormenData.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

importVormen().catch((error: any) => {
  console.error('\n❌ Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
