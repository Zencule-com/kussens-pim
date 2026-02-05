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
const productsDataPath = join(homedir(), 'Downloads/Product/Product.json')
const imagesBasePath = join(homedir(), 'PhpstormProjects/kussensnu/public')

interface ProductData {
  id: number
  uid: string
  category: string // "Zitkussens", "Rugkussens", "Kussen op maat"
  name: string
  imagePath: string // "/images/products/..." of alleen bestandsnaam
  modelPath: string
  active: boolean
  fields: string // JSON string
  shapes: string // JSON string array zoals "[\"rechthoekig\", \"rond\"]"
  createdAt: string
  updatedAt: string
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
  return 'overig' // Kussen op maat en andere -> overig
}

// Upload afbeelding naar Media collectie
async function uploadImage(
  payload: any,
  imagePath: string,
  productName: string
): Promise<string | null> {
  if (!imagePath || imagePath.trim() === '') return null

  try {
    // Bepaal het volledige pad
    let fullImagePath: string
    if (imagePath.startsWith('/')) {
      // Volledig pad vanaf public folder
      fullImagePath = join(imagesBasePath, imagePath)
    } else {
      // Alleen bestandsnaam, zoek in images/products folder
      fullImagePath = join(imagesBasePath, 'images/products', imagePath)
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
      name: `products/${fileName}`, // Folder voor products
      data: fileBuffer,
      mimetype: mimeType,
      size: fileBuffer.length,
    }

    const altText = `${productName} - ${fileName}`

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: altText,
        prefix: 'products', // Folder voor products
      },
      file: file,
    })

    return mediaDoc.id
  } catch (error: any) {
    console.error(`✗ Error uploading image ${imagePath}:`, error?.message || error)
    return null
  }
}

async function importProducts() {
  console.log('🚀 Starting products import...\n')

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
  let productsData: ProductData[]

  try {
    productsData = JSON.parse(readFileSync(productsDataPath, 'utf-8'))
    console.log(`   ✓ Loaded ${productsData.length} products\n`)
  } catch (error: any) {
    console.error(`   ✗ Error parsing JSON: ${error.message}`)
    process.exit(1)
  }

  console.log('3️⃣ Starting import...\n')

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  let imageUploadCount = 0

  for (const product of productsData) {
    try {
      // Check of product al bestaat (op basis van uid)
      const existing = await payload.find({
        collection: 'products',
        where: {
          uid: {
            equals: product.uid,
          },
        },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skippedCount++
        console.log(`⊘ Product "${product.name}" already exists, skipping`)
        continue
      }

      // Upload afbeelding
      let imageId: string | null = null
      if (product.imagePath) {
        imageId = await uploadImage(payload, product.imagePath, product.name)
        if (imageId) {
          imageUploadCount++
          console.log(`  ✓ Uploaded image: ${basename(product.imagePath)}`)
        }
      }

      // Map category
      const category = mapCategory(product.category)

      // Parse shapes en zoek de vorm IDs
      let vormIds: string[] = []
      if (product.shapes) {
        try {
          const shapesArray = JSON.parse(product.shapes) as string[]
          // Zoek de vormen op basis van de key
          for (const shapeKey of shapesArray) {
            const vorm = await payload.find({
              collection: 'vormen',
              where: {
                key: {
                  equals: shapeKey,
                },
              },
              limit: 1,
            })
            if (vorm.docs.length > 0) {
              vormIds.push(vorm.docs[0].id)
            }
          }
        } catch (error) {
          // Shapes parsing failed, skip
        }
      }

      // Maak product aan
      await payload.create({
        collection: 'products',
        data: {
          uid: product.uid, // Exact overnemen - slug voor calculatie
          name: product.name,
          description: undefined,
          category: category,
          image: imageId || undefined,
          active: product.active !== undefined ? product.active : true,
          vormen: vormIds.length > 0 ? vormIds : undefined,
        },
      })

      successCount++
      console.log(`✓ Created product "${product.name}" (category: ${category})`)
    } catch (error: any) {
      errorCount++
      console.error(`✗ Error creating product "${product.name}":`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total products: ${productsData.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Already existed (skipped): ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Images uploaded: ${imageUploadCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

importProducts().catch((error: any) => {
  console.error('\n❌ Fatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
