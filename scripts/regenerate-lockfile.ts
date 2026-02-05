import { execSync } from 'child_process'
import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'

const rootDir = join(import.meta.dirname, '..')
const lockfilePath = join(rootDir, 'package-lock.json')

console.log('🔄 Regenerating package-lock.json...\n')

if (existsSync(lockfilePath)) {
  console.log('1️⃣ Removing old package-lock.json...')
  unlinkSync(lockfilePath)
  console.log('   ✓ Removed\n')
}

console.log('2️⃣ Running npm install --legacy-peer-deps...')
try {
  execSync('npm install --legacy-peer-deps', {
    cwd: rootDir,
    stdio: 'inherit',
  })
  console.log('\n✅ package-lock.json regenerated successfully!')
  console.log('\nNext steps:')
  console.log('1. git add package-lock.json')
  console.log('2. git commit -m "Regenerate package-lock.json"')
  console.log('3. git push origin main')
} catch (error) {
  console.error('\n❌ Error regenerating package-lock.json:', error)
  process.exit(1)
}
