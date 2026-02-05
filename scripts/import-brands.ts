import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lees het JSON bestand (vanuit Downloads folder in home directory)
const brandsDataPath = join(homedir(), 'Downloads/Brand/Brand.json')
const brandsData = JSON.parse(readFileSync(brandsDataPath, 'utf-8'))

interface BrandData {
  name: string
  price: number
  discount: number | null
  application: 'Indoor' | 'Outdoor' | 'Both' | null
  description: string | null
}

// Map application waarden van JSON naar Payload
function mapApplication(app: string | null): 'binnen' | 'buiten' | 'beide' | null {
  if (!app) return null
  const mapping: Record<string, 'binnen' | 'buiten' | 'beide'> = {
    Indoor: 'binnen',
    Outdoor: 'buiten',
    Both: 'beide',
  }
  return mapping[app] || null
}

async function importBrands() {
  const payload = await getPayload({ config })

  console.log('Starting import...')
  console.log(`Found ${brandsData.length} brands to import`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (const item of brandsData as BrandData[]) {
    try {
      // Check of merk al bestaat
      const existing = await payload.find({
        collection: 'merken',
        where: {
          merknaam: {
            equals: item.name,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Brand "${item.name}" already exists, skipping`)
        continue
      }

      // Maak nieuw merk aan met alle velden
      await payload.create({
        collection: 'merken',
        data: {
          merknaam: item.name,
          prijs: item.price,
          korting: item.discount || undefined, // null wordt undefined voor Payload
          toepassing: mapApplication(item.application),
          beschrijving: item.description || undefined,
        },
      })

      successCount++
      console.log(`✓ Created brand "${item.name}"`)
    } catch (error) {
      errorCount++
      console.error(`✗ Error creating brand "${item.name}":`, error)
    }
  }

  console.log('\n=== Import Summary ===')
  console.log(`Total brands: ${brandsData.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)

  process.exit(0)
}

// Run import
importBrands().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
