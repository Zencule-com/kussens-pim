import 'dotenv/config'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'

console.log('🧪 Basic Fabric Import Test\n')
console.log('='.repeat(60))

// Test 1: JSON file
const fabricsPath = join(homedir(), 'Downloads/Fabric/Fabric.json')
console.log('\n1️⃣ Checking JSON file...')
if (existsSync(fabricsPath)) {
  try {
    const data = JSON.parse(readFileSync(fabricsPath, 'utf-8'))
    console.log(`   ✓ Found ${data.length} fabrics`)
  } catch (e: any) {
    console.log(`   ✗ Error: ${e.message}`)
    process.exit(1)
  }
} else {
  console.log(`   ✗ Not found at: ${fabricsPath}`)
  process.exit(1)
}

// Test 2: Images directory
const imagesPath = join(homedir(), 'PhpstormProjects/kussensnu/public')
console.log('\n2️⃣ Checking images directory...')
if (existsSync(imagesPath)) {
  console.log(`   ✓ Found at: ${imagesPath}`)
} else {
  console.log(`   ✗ Not found at: ${imagesPath}`)
  process.exit(1)
}

// Test 3: Sample images
console.log('\n3️⃣ Checking sample images...')
try {
  const data = JSON.parse(readFileSync(fabricsPath, 'utf-8'))
  let found = 0
  let missing = 0
  
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const fabric = data[i]
    const imgPath = join(imagesPath, fabric.image)
    if (existsSync(imgPath)) {
      found++
      if (found <= 3) {
        const stats = statSync(imgPath)
        console.log(`   ✓ ${basename(fabric.image)} (${(stats.size / 1024).toFixed(1)} KB)`)
      }
    } else {
      missing++
      if (missing <= 3) {
        console.log(`   ✗ ${fabric.image}`)
      }
    }
  }
  console.log(`   Summary: ${found} found, ${missing} missing out of ${Math.min(10, data.length)} checked`)
} catch (e: any) {
  console.log(`   ✗ Error: ${e.message}`)
}

// Test 4: Environment
console.log('\n4️⃣ Checking environment variables...')
const envVars = ['PAYLOAD_SECRET', 'DATABASE_URL', 'MINIO_BUCKET', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']
let envOk = true
envVars.forEach(env => {
  if (process.env[env]) {
    console.log(`   ✓ ${env}`)
  } else {
    console.log(`   ✗ ${env} - MISSING`)
    envOk = false
  }
})

console.log('\n' + '='.repeat(60))
if (envOk) {
  console.log('✅ Basic checks passed!')
  console.log('\n💡 Run: npm run test:fabrics (for full test with Payload)')
  console.log('💡 Run: npm run import:fabrics (to start import)')
} else {
  console.log('⚠️  Some environment variables are missing!')
}
console.log('='.repeat(60))

process.exit(0)
