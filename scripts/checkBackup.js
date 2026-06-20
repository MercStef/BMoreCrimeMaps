import fs from 'fs/promises'
import { spawnSync } from 'child_process'

const BACKUP_PATH = './public/data/crime-backup.json'

async function readBackup() {
  try {
    const txt = await fs.readFile(BACKUP_PATH, 'utf8')
    return JSON.parse(txt)
  } catch (e) {
    return null
  }
}

function firstOfCurrentMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

async function main() {
  const backup = await readBackup()

  if (!backup || !backup.generatedAt) {
    console.log('No backup found or missing generatedAt — running backup.')
    runBackup()
    return
  }

  const generated = new Date(backup.generatedAt)
  const threshold = firstOfCurrentMonth()

  if (generated < threshold) {
    console.log(`Backup is outdated (generated ${generated.toISOString()}); running backup.`)
    runBackup()
  } else {
    console.log(`Backup is current (generated ${generated.toISOString()}). No action needed.`)
  }
}

function runBackup() {
  // Use npm script that runs the JS backup so environment/permissions are consistent
  const res = spawnSync('npm', ['run', 'backup:data'], { stdio: 'inherit' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

main().catch((err) => {
  console.error('checkBackup failed:', err)
  process.exit(1)
})
