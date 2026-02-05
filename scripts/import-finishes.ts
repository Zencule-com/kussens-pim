import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lees de JSON bestanden
const finishesDataPath = join(homedir(), 'Downloads/Finish/Finish.json')
const finishRulesDataPath = join(homedir(), 'Downloads/Finish/FinishRule.json')
const imagesBasePath = join(homedir(), 'PhpstormProjects/kussensnu/public')

interface FinishData {
  name: string
  description: string
  image: string
  imageAlternative: string
  products: string // String zoals "{zitstrak,rugstrak,...}"
  id: number
}

interface FinishRuleData {
  id: number
  finishId: number
  between: string
  price: number
}

// Parse products string naar array
function parseProducts(productsString: string): string[] {
  if (!productsString) return []
  // Verwijder { en } en split op komma
  return productsString
    .replace(/[{}]/g, '')
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

// Upload afbeelding naar Media collectie
async function uploadImage(
  payload: any,
  imagePath: string,
  finishName: string,
  isAlternative: boolean = false
): Promise<string | null> {
  if (!imagePath || imagePath.trim() === '') return null

  try {
    // Als imageAlternative alleen een bestandsnaam is (zonder pad), zoek in images/finishes
    let fullImagePath: string
    if (imagePath.startsWith('/')) {
      fullImagePath = join(imagesBasePath, imagePath)
    } else {
      // Alleen bestandsnaam, zoek in images/finishes folder
      fullImagePath = join(imagesBasePath, 'images/finishes', imagePath)
    }

    if (!existsSync(fullImagePath)) {
      console.error(`✗ Image not found: ${fullImagePath}`)
      return null
    }

    const fileBuffer = readFileSync(fullImagePath)
    const fileName = basename(imagePath)

    const mimeType = fileName.endsWith('.webp')
      ? 'image/webp'
      : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
        ? 'image/jpeg'
        : fileName.endsWith('.png')
          ? 'image/png'
          : 'image/webp'

    const file = {
      name: `finishes/${fileName}`, // Folder voor finishes
      data: fileBuffer,
      mimetype: mimeType,
      size: fileBuffer.length,
    }

    const altText = isAlternative
      ? `${finishName} - Alternatief - ${fileName}`
      : `${finishName} - ${fileName}`

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: altText,
        prefix: 'finishes', // Folder voor finishes
      },
      file: file,
    })

    return mediaDoc.id
  } catch (error: any) {
    console.error(`✗ Error uploading image ${imagePath}:`, error?.message || error)
    return null
  }
}

async function importFinishes() {
  console.log('🚀 Starting finishes import...\n')

  let payload
  try {
    console.log('1️⃣ Initializing Payload...')
    payload = await getPayload({ config })
    console.log('   ✓ Payload initialized successfully\n')
  } catch (error: any) {
    console.error('   ✗ Error initializing Payload:', error?.message || error)
    process.exit(1)
  }

  // Lees JSON bestanden
  console.log('2️⃣ Loading JSON files...')
  let finishesData: FinishData[]
  let finishRulesData: FinishRuleData[]

  try {
    finishesData = JSON.parse(readFileSync(finishesDataPath, 'utf-8'))
    finishRulesData = JSON.parse(readFileSync(finishRulesDataPath, 'utf-8'))
    console.log(`   ✓ Loaded ${finishesData.length} finishes and ${finishRulesData.length} rules\n`)
  } catch (error: any) {
    console.error(`   ✗ Error parsing JSON: ${error.message}`)
    process.exit(1)
  }

  // Maak een map van finishId -> rules
  const rulesMap = new Map<number, FinishRuleData[]>()
  finishRulesData.forEach((rule) => {
    if (!rulesMap.has(rule.finishId)) {
      rulesMap.set(rule.finishId, [])
    }
    rulesMap.get(rule.finishId)!.push(rule)
  })

  console.log('3️⃣ Starting import...\n')

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let imageUploadCount = 0

  for (const finish of finishesData) {
    try {
      // Check of finish al bestaat
      const existing = await payload.find({
        collection: 'finishes',
        where: {
          name: {
            equals: finish.name,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Finish "${finish.name}" already exists, skipping`)
        continue
      }

      // Upload afbeeldingen
      let imageId: string | null = null
      let imageAlternativeId: string | null = null

      if (finish.image) {
        imageId = await uploadImage(payload, finish.image, finish.name, false)
        if (imageId) {
          imageUploadCount++
          console.log(`  ✓ Uploaded main image: ${basename(finish.image)}`)
        }
      }

      if (finish.imageAlternative && finish.imageAlternative.trim() !== '') {
        imageAlternativeId = await uploadImage(payload, finish.imageAlternative, finish.name, true)
        if (imageAlternativeId) {
          imageUploadCount++
          console.log(`  ✓ Uploaded alternative image: ${finish.imageAlternative}`)
        }
      }

      // Haal de rules op voor deze finish
      const rules = rulesMap.get(finish.id) || []
      const sortedRules = rules.sort((a, b) => {
        // Sorteer op het eerste getal in "between"
        const aStart = parseInt(a.between.split('-')[0]) || 0
        const bStart = parseInt(b.between.split('-')[0]) || 0
        return aStart - bStart
      })

      // Maak finish aan
      const finishDoc = await payload.create({
        collection: 'finishes',
        data: {
          name: finish.name,
          description: finish.description || '',
          image: imageId || undefined,
          imageAlternative: imageAlternativeId || undefined,
          products: parseProducts(finish.products),
        },
      })

      // Maak finish rules aan voor deze finish
      let rulesCreated = 0
      for (const rule of sortedRules) {
        try {
          await payload.create({
            collection: 'finish-rules',
            data: {
              finish: finishDoc.id,
              between: rule.between,
              price: rule.price,
            },
          })
          rulesCreated++
        } catch (error: any) {
          console.error(`  ✗ Error creating rule "${rule.between}" for "${finish.name}":`, error?.message || error)
        }
      }

      successCount++
      console.log(`✓ Created finish "${finish.name}" with ${rulesCreated}/${sortedRules.length} price rules`)
    } catch (error: any) {
      errorCount++
      console.error(`✗ Error creating finish "${finish.name}":`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total finishes: ${finishesData.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Images uploaded: ${imageUploadCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

importFinishes().catch((error: any) => {
  console.error('\n❌ Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
