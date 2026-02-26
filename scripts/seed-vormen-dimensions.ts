import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SHAPE_DIMENSIONS: Record<string, { fields: Record<string, boolean>; defaultDims: Record<string, number> }> = {
  rechthoekig: {
    fields: { length: true, depth: true, thickness: true },
    defaultDims: { length: 50, depth: 50, thickness: 10 },
  },
  rond: {
    fields: { diameter: true, thickness: true },
    defaultDims: { diameter: 50, thickness: 10 },
  },
  'rug-schuin': {
    fields: { lengthUpper: true, lengthLower: true, height: true, thickness: true },
    defaultDims: { lengthUpper: 30, lengthLower: 50, height: 50, thickness: 10 },
  },
  'schuine-zijde-links': {
    fields: { lengthBack: true, lengthFront: true, depth: true, thickness: true },
    defaultDims: { lengthBack: 50, lengthFront: 30, depth: 50, thickness: 10 },
  },
  'schuine-zijde-rechts': {
    fields: { lengthBack: true, lengthFront: true, depth: true, thickness: true },
    defaultDims: { lengthBack: 50, lengthFront: 30, depth: 50, thickness: 10 },
  },
  'plof-kussen': {
    fields: { length: true, depth: true },
    defaultDims: { length: 60, depth: 60, thickness: 7 },
  },
  sier: {
    fields: { length: true, depth: true, thickness: true },
    defaultDims: { length: 45, depth: 45, thickness: 5 },
  },
  'sier-rechthoekig': {
    fields: { length: true, depth: true, thickness: true },
    defaultDims: { length: 50, depth: 30, thickness: 5 },
  },
  kussenopplank: {
    fields: { length: true, depth: true, thickness: true },
    defaultDims: { length: 50, depth: 50, thickness: 10 },
  },
}

async function seedDimensions() {
  console.log('Starting vormen dimension seed...\n')

  const payload = await getPayload({ config })
  console.log('Payload initialized\n')

  const res = await payload.find({
    collection: 'vormen',
    limit: 500,
  })

  console.log(`Found ${res.docs.length} vormen in database\n`)

  let updatedCount = 0
  let skippedCount = 0

  for (const vorm of res.docs) {
    const key = vorm.key as string
    const dims = SHAPE_DIMENSIONS[key]

    if (!dims) {
      skippedCount++
      console.log(`Skipped "${key}" - no dimension data defined`)
      continue
    }

    await payload.update({
      collection: 'vormen',
      id: vorm.id,
      data: {
        fields: dims.fields,
        defaultDims: dims.defaultDims,
      },
    })

    updatedCount++
    console.log(`Updated "${key}" with fields=${JSON.stringify(dims.fields)} defaultDims=${JSON.stringify(dims.defaultDims)}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('SEED SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total vormen: ${res.docs.length}`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Skipped: ${skippedCount}`)
  console.log('='.repeat(60))

  process.exit(0)
}

seedDimensions().catch((error: any) => {
  console.error('Fatal error:', error?.message || error)
  process.exit(1)
})
