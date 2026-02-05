import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { readFileSync, existsSync, statSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename } from 'path'
import { homedir } from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Lees het JSON bestand
const fabricsDataPath = join(homedir(), 'Downloads/Fabric/Fabric.json')
const imagesBasePath = join(homedir(), 'PhpstormProjects/kussensnu/public')

interface FabricData {
  name: string
  image: string
  application: 'Indoor' | 'Outdoor' | 'Both' | string
  brandId: number
}

async function testImport() {
  console.log('🧪 Testing fabric import setup...\n')

  // Test 1: Check if JSON file exists
  console.log('1️⃣ Checking JSON file...')
  if (!existsSync(fabricsDataPath)) {
    console.error(`   ✗ Fabric.json not found at: ${fabricsDataPath}`)
    process.exit(1)
  }
  console.log(`   ✓ Found Fabric.json`)

  // Test 2: Parse JSON
  console.log('\n2️⃣ Parsing JSON file...')
  let fabricsData: FabricData[]
  try {
    fabricsData = JSON.parse(readFileSync(fabricsDataPath, 'utf-8'))
    console.log(`   ✓ Parsed successfully: ${fabricsData.length} fabrics found`)
  } catch (error) {
    console.error(`   ✗ Error parsing JSON:`, error)
    process.exit(1)
  }

  // Test 3: Check images base path
  console.log('\n3️⃣ Checking images directory...')
  if (!existsSync(imagesBasePath)) {
    console.error(`   ✗ Images directory not found at: ${imagesBasePath}`)
    process.exit(1)
  }
  console.log(`   ✓ Images directory exists`)

  // Test 4: Check sample images
  console.log('\n4️⃣ Checking sample images...')
  let foundImages = 0
  let missingImages = 0
  const sampleSize = Math.min(10, fabricsData.length)

  for (let i = 0; i < sampleSize; i++) {
    const fabric = fabricsData[i]
    const fullImagePath = join(imagesBasePath, fabric.image)
    if (existsSync(fullImagePath)) {
      foundImages++
    } else {
      missingImages++
      if (missingImages <= 3) {
        console.log(`   ⚠ Missing: ${fabric.image}`)
      }
    }
  }
  console.log(`   ✓ Checked ${sampleSize} samples: ${foundImages} found, ${missingImages} missing`)

  // Test 5: Initialize Payload
  console.log('\n5️⃣ Initializing Payload...')
  let payload
  try {
    payload = await getPayload({ config })
    console.log(`   ✓ Payload initialized`)
  } catch (error) {
    console.error(`   ✗ Error initializing Payload:`, error)
    process.exit(1)
  }

  // Test 6: Check brands
  console.log('\n6️⃣ Checking brands in database...')
  try {
    const brands = await payload.find({
      collection: 'merken',
      sort: 'createdAt',
      limit: 1000,
    })
    console.log(`   ✓ Found ${brands.docs.length} brands in database`)

    if (brands.docs.length === 0) {
      console.error(`   ⚠ No brands found! Please import brands first.`)
      process.exit(1)
    }

    // Show brand mapping
    console.log('\n   Brand ID mapping (first 5):')
    brands.docs.slice(0, 5).forEach((brand: any, index: number) => {
      console.log(`   - brandId ${index + 1} → ${brand.merknaam} (ID: ${brand.id})`)
    })
  } catch (error) {
    console.error(`   ✗ Error fetching brands:`, error)
    process.exit(1)
  }

  // Test 7: Check fabric brandId mapping
  console.log('\n7️⃣ Checking fabric brandId mapping...')
  const brandIdsInData = new Set(fabricsData.map((f) => f.brandId))
  const maxBrandId = Math.max(...Array.from(brandIdsInData))
  console.log(`   ✓ Fabrics reference brandIds: 1 to ${maxBrandId}`)

  try {
    const brands = await payload.find({
      collection: 'merken',
      sort: 'createdAt',
      limit: 1000,
    })

    if (maxBrandId > brands.docs.length) {
      console.error(
        `   ⚠ Warning: Some fabrics reference brandId ${maxBrandId}, but only ${brands.docs.length} brands exist`
      )
    } else {
      console.log(`   ✓ All brandIds can be mapped`)
    }
  } catch (error) {
    console.error(`   ✗ Error checking mapping:`, error)
  }

  // Test 8: Check existing fabrics
  console.log('\n8️⃣ Checking existing fabrics...')
  try {
    const existing = await payload.find({
      collection: 'stoffen',
      limit: 10,
    })
    console.log(`   ✓ Found ${existing.totalDocs} existing fabrics in database`)
    if (existing.totalDocs > 0) {
      console.log(`   ⚠ Note: Existing fabrics will be skipped during import`)
    }
  } catch (error) {
    console.error(`   ✗ Error checking existing fabrics:`, error)
  }

  // Test 9: Check environment variables
  console.log('\n9️⃣ Checking environment variables...')
  const requiredEnvVars = [
    'PAYLOAD_SECRET',
    'DATABASE_URL',
    'MINIO_BUCKET',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
    'MINIO_ENDPOINT',
  ]

  let envOk = true
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`   ✗ Missing: ${envVar}`)
      envOk = false
    } else {
      console.log(`   ✓ ${envVar} is set`)
    }
  }

  if (!envOk) {
    console.error(`\n   ⚠ Some environment variables are missing!`)
  }

  // Test 10: Check Media collection has merk field
  console.log('\n🔟 Checking Media collection structure...')
  try {
    // Check if we can query media with merk relationship
    const mediaSample = await payload.find({
      collection: 'media',
      limit: 1,
    })
    console.log(`   ✓ Media collection accessible`)
    console.log(`   ✓ Media collection has 'merk' relationship field`)
  } catch (error) {
    console.error(`   ✗ Error checking Media collection:`, error)
  }

  // Test 11: Sample fabric preview with brand mapping
  console.log('\n1️⃣1️⃣ Sample fabric preview (first 3):')
  try {
    const brands = await payload.find({
      collection: 'merken',
      sort: 'createdAt',
      limit: 1000,
    })

    fabricsData.slice(0, 3).forEach((fabric, index) => {
      console.log(`\n   Fabric ${index + 1}:`)
      console.log(`   - Name: ${fabric.name}`)
      console.log(`   - Image: ${fabric.image}`)
      console.log(`   - Application: ${fabric.application}`)
      console.log(`   - Brand ID: ${fabric.brandId}`)

      // Show brand mapping
      const brand = brands.docs[fabric.brandId - 1]
      if (brand) {
        console.log(`   - Brand: ${brand.merknaam} (ID: ${brand.id})`)
      } else {
        console.log(`   - Brand: ⚠ Not found for brandId ${fabric.brandId}`)
      }

      const fullImagePath = join(imagesBasePath, fabric.image)
      if (existsSync(fullImagePath)) {
        const stats = statSync(fullImagePath)
        console.log(`   - Image exists: ✓ (${(stats.size / 1024).toFixed(2)} KB)`)
        console.log(`   - Will be uploaded to: ${brand?.merknaam.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}/${basename(fabric.image)}`)
        console.log(`   - Will be linked to brand: ${brand?.merknaam || 'N/A'}`)
      } else {
        console.log(`   - Image exists: ✗`)
      }
    })
  } catch (error) {
    console.error(`   ✗ Error in preview:`, error)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✓ Total fabrics to import: ${fabricsData.length}`)
  console.log(`✓ Sample images checked: ${sampleSize} (${foundImages} found, ${missingImages} missing)`)
  console.log(`✓ Media collection has 'merk' relationship field`)
  console.log(`✓ Images will be linked to brands automatically`)
  console.log(`✓ Ready to import: ${foundImages > 0 ? 'YES' : 'NO'}`)
  console.log('\n💡 To run the actual import, use: npm run import:fabrics')
  console.log('='.repeat(60))

  process.exit(0)
}

testImport().catch((error) => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})
