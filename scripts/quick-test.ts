import { readFileSync, existsSync, statSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'

console.log('🧪 Quick test starting...\n')

const fabricsDataPath = join(homedir(), 'Downloads/Fabric/Fabric.json')
const imagesBasePath = join(homedir(), 'PhpstormProjects/kussensnu/public')

// Test 1: JSON file
console.log('1. Checking JSON file...')
if (existsSync(fabricsDataPath)) {
  const data = JSON.parse(readFileSync(fabricsDataPath, 'utf-8'))
  console.log(`   ✓ Found ${data.length} fabrics`)
  
  // Test 2: Sample images
  console.log('\n2. Checking sample images...')
  let found = 0
  let missing = 0
  
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const fabric = data[i]
    const imgPath = join(imagesBasePath, fabric.image)
    if (existsSync(imgPath)) {
      found++
      const stats = statSync(imgPath)
      console.log(`   ✓ ${basename(fabric.image)} (${(stats.size / 1024).toFixed(1)} KB)`)
    } else {
      missing++
      console.log(`   ✗ ${fabric.image} - NOT FOUND`)
    }
  }
  
  console.log(`\n   Summary: ${found} found, ${missing} missing`)
} else {
  console.log(`   ✗ JSON file not found at: ${fabricsDataPath}`)
}

console.log('\n✅ Quick test completed!')
