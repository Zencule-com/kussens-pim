#!/usr/bin/env node
import 'dotenv/config'

console.log('🧪 Starting simple test...\n')

// Test 1: Environment variables
console.log('1. Environment variables:')
const required = ['PAYLOAD_SECRET', 'DATABASE_URL', 'MINIO_BUCKET', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']
required.forEach(env => {
  const value = process.env[env]
  if (value) {
    console.log(`   ✓ ${env}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`   ✗ ${env}: MISSING`)
  }
})

// Test 2: File existence
console.log('\n2. File checks:')
import { existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const fabricsPath = join(homedir(), 'Downloads/Fabric/Fabric.json')
const imagesPath = join(homedir(), 'PhpstormProjects/kussensnu/public')

console.log(`   Fabric.json: ${existsSync(fabricsPath) ? '✓' : '✗'}`)
console.log(`   Images dir: ${existsSync(imagesPath) ? '✓' : '✗'}`)

// Test 3: Try to import Payload
console.log('\n3. Payload initialization:')
try {
  const { getPayload } = await import('payload')
  const config = await import('../src/payload.config.js')
  console.log('   ✓ Imports successful')
  
  console.log('   Initializing Payload...')
  const payload = await getPayload({ config: config.default })
  console.log('   ✓ Payload initialized')
  
  // Test Media collection
  console.log('\n4. Media collection check:')
  const media = await payload.find({ collection: 'media', limit: 1 })
  console.log(`   ✓ Media collection accessible (${media.totalDocs} items)`)
  
  // Test Merken collection
  console.log('\n5. Merken collection check:')
  const merken = await payload.find({ collection: 'merken', limit: 5 })
  console.log(`   ✓ Merken collection accessible (${merken.totalDocs} total)`)
  if (merken.docs.length > 0) {
    console.log('   Sample brands:')
    merken.docs.forEach((m: any) => {
      console.log(`     - ${m.merknaam} (ID: ${m.id})`)
    })
  }
  
  console.log('\n✅ All tests passed!')
  process.exit(0)
} catch (error: any) {
  console.error('   ✗ Error:', error.message)
  console.error('   Stack:', error.stack?.split('\n').slice(0, 3).join('\n'))
  process.exit(1)
}
