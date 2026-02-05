import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lees het JSON bestand
console.log('📂 Loading Fabric.json...')
const fabricsDataPath = join(homedir(), 'Downloads/Fabric/Fabric.json')

if (!existsSync(fabricsDataPath)) {
  console.error(`✗ Fabric.json not found at: ${fabricsDataPath}`)
  process.exit(1)
}

let fabricsData
try {
  fabricsData = JSON.parse(readFileSync(fabricsDataPath, 'utf-8'))
  console.log(`✓ Loaded ${fabricsData.length} fabrics from JSON\n`)
} catch (error: any) {
  console.error(`✗ Error parsing JSON: ${error.message}`)
  process.exit(1)
}

// Pad naar de afbeeldingen in het andere project
const imagesBasePath = join(homedir(), 'PhpstormProjects/kussensnu/public')

interface FabricData {
  name: string
  image: string
  application: 'Indoor' | 'Outdoor' | 'Both' | string
  brandId: number
}

// Map application waarden
function mapApplication(app: string | null | undefined): 'binnen' | 'buiten' | 'beide' {
  if (!app) return 'beide'
  const mapping: Record<string, 'binnen' | 'buiten' | 'beide'> = {
    Indoor: 'binnen',
    Outdoor: 'buiten',
    Both: 'beide',
  }
  return mapping[app] || 'beide'
}

// Functie om merk ID te vinden op basis van brandId (volgens volgorde in import)
async function getBrandIdByOrder(payload: any, brandId: number): Promise<string | null> {
  // Haal alle merken op gesorteerd op createdAt
  const brands = await payload.find({
    collection: 'merken',
    sort: 'createdAt',
    limit: 1000,
  })

  // brandId is 1-based, dus gebruik index brandId - 1
  if (brands.docs[brandId - 1]) {
    return brands.docs[brandId - 1].id
  }

  return null
}

// Functie om merknaam te krijgen voor folder naam
async function getBrandNameForFolder(payload: any, brandId: number): Promise<string> {
  const brands = await payload.find({
    collection: 'merken',
    sort: 'createdAt',
    limit: 1000,
  })

  if (brands.docs[brandId - 1]) {
    // Maak folder naam URL-vriendelijk
    return brands.docs[brandId - 1].merknaam
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  return 'unknown'
}

// Functie om afbeelding te uploaden naar MinIO
async function uploadImage(
  payload: any,
  imagePath: string,
  brandFolderName: string,
  fabricName: string,
  merkId: string
): Promise<string | null> {
  try {
    // Volledige pad naar de afbeelding
    const fullImagePath = join(imagesBasePath, imagePath)

    if (!existsSync(fullImagePath)) {
      console.error(`✗ Image not found: ${fullImagePath}`)
      return null
    }

    // Lees het bestand
    const fileBuffer = readFileSync(fullImagePath)
    const originalFileName = basename(imagePath)

    // Bepaal MIME type
    const mimeType = originalFileName.endsWith('.webp')
      ? 'image/webp'
      : originalFileName.endsWith('.jpg') || originalFileName.endsWith('.jpeg')
        ? 'image/jpeg'
        : originalFileName.endsWith('.png')
          ? 'image/png'
          : 'image/webp'

    // Maak filename met folder prefix voor S3/MinIO folder structuur
    // Format: brand-folder-name/original-filename
    // De S3 adapter zou de folder structuur moeten respecteren
    const fileNameWithPrefix = `${brandFolderName}/${originalFileName}`

    const file: {
      name: string
      data: Buffer
      mimetype: string
      size: number
    } = {
      name: fileNameWithPrefix, // Folder structuur in de filename
      data: fileBuffer,
      mimetype: mimeType,
      size: fileBuffer.length,
    }

    console.log(`     Uploading image: ${fileNameWithPrefix} (${(fileBuffer.length / 1024).toFixed(1)} KB)`)

    // Upload naar media collectie
    // De prefix wordt automatisch ingesteld via de hook op basis van het merk
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: `${fabricName} - ${brandFolderName}`,
        merk: merkId, // Relatie met het merk (hook zal prefix instellen)
        prefix: brandFolderName, // Stel direct in voor zekerheid
      },
      file: file,
    })

    console.log(`     ✓ Image uploaded: ${mediaDoc.id}`)

    return mediaDoc.id
  } catch (error) {
    console.error(`✗ Error uploading image ${imagePath}:`, error)
    return null
  }
}

async function importFabrics() {
  console.log('🚀 Starting fabric import...\n')
  
  let payload
  try {
    console.log('1️⃣ Initializing Payload...')
    payload = await getPayload({ config })
    console.log('   ✓ Payload initialized successfully\n')
  } catch (error: any) {
    console.error('   ✗ Error initializing Payload:', error?.message || error)
    if (error?.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 5).join('\n'))
    }
    process.exit(1)
  }

  console.log('2️⃣ Starting fabric import...')
  console.log(`   Found ${fabricsData.length} fabrics to import\n`)
  
  // Importeer alle stoffen
  const fabricsToImport = fabricsData

  // Stap 1: Verzamel alle merken voor mapping
  console.log('3️⃣ Fetching brands from database...')
  let brands
  try {
    brands = await payload.find({
      collection: 'merken',
      sort: 'createdAt',
      limit: 1000,
    })
    console.log(`   ✓ Found ${brands.docs.length} brands for mapping\n`)
  } catch (error: any) {
    console.error('   ✗ Error fetching brands:', error?.message || error)
    process.exit(1)
  }

  // Stap 2: Maak brandId -> merk ID map
  const brandIdMap = new Map<number, string>()
  const brandNameMap = new Map<number, string>()

  brands.docs.forEach((brand: any, index: number) => {
    const brandId = index + 1 // 1-based
    brandIdMap.set(brandId, brand.id)
    brandNameMap.set(
      brandId,
      brand.merknaam
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    )
  })

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let imageUploadCount = 0
  let imageErrorCount = 0

  // Stap 3: Importeer stoffen
  console.log('4️⃣ Starting fabric import...\n')
  let processed = 0
  
  for (const item of fabricsToImport as FabricData[]) {
    processed++
    if (processed % 10 === 0) {
      console.log(`   Processing... ${processed}/${fabricsToImport.length}`)
    }
    try {
      // Check of stof al bestaat
      const existing = await payload.find({
        collection: 'stoffen',
        where: {
          naam: {
            equals: item.name,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Fabric "${item.name}" already exists, skipping`)
        continue
      }

      // Vind merk ID
      const merkId = brandIdMap.get(item.brandId)
      if (!merkId) {
        errorCount++
        console.error(`✗ No brand found for brandId ${item.brandId} (fabric: "${item.name}")`)
        continue
      }

      const brandFolderName = brandNameMap.get(item.brandId) || 'unknown'

      // Upload afbeelding
      let imageId: string | null = null
      if (item.image) {
        try {
          imageId = await uploadImage(payload, item.image, brandFolderName, item.name, merkId)
          if (imageId) {
            imageUploadCount++
            console.log(`  ✓ Uploaded image for "${item.name}" (linked to brand)`)
          } else {
            imageErrorCount++
          }
        } catch (error) {
          imageErrorCount++
          console.error(`  ✗ Failed to upload image for "${item.name}":`, error)
        }
      }

      // Maak nieuwe stof aan
      await payload.create({
        collection: 'stoffen',
        data: {
          naam: item.name,
          merk: merkId,
          toepassing: mapApplication(item.application),
          prijsPerMeter: 0, // Standaard prijs, kan later worden aangepast
          kuntleder: false,
          afbeelding: imageId || undefined,
        },
      })

      successCount++
      console.log(`✓ Created fabric "${item.name}"`)
    } catch (error) {
      errorCount++
      console.error(`✗ Error creating fabric "${item.name}":`, error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total fabrics in JSON: ${fabricsData.length}`)
  console.log(`Fabrics processed: ${fabricsToImport.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Images uploaded: ${imageUploadCount}`)
  console.log(`Image upload errors: ${imageErrorCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

// Run import
console.log('🚀 Fabric Import Script')
console.log('='.repeat(60))
console.log('')

importFabrics().catch((error: any) => {
  console.error('\n❌ Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
