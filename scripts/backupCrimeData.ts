import fs from 'fs/promises'

// ------------------------------
// ENDPOINTS
// ------------------------------
const BASE =
  'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/NIBRS_GroupA_Crime_Data/FeatureServer/0/query'

const HOMICIDES_BASE =
  'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Homicides_Shootings_YTD/FeatureServer/0/query'

// ------------------------------
// HELPERS
// ------------------------------
async function queryArcGISUrl(base: string, params: Record<string, string>) {
  const res = await fetch(`${base}?${new URLSearchParams(params)}`)
  if (!res.ok) throw new Error(`ArcGIS error: ${res.status}`)

  const data = await res.json()
  if (!data.features) throw new Error('No features returned')

  return data.features
}

async function queryAllPages(base: string, where: string) {
  const PAGE_SIZE = 1000
  let offset = 0
  const all: any[] = []

  while (true) {
    const features = await queryArcGISUrl(base, {
      where,
      outFields: '*',
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      f: 'json',
    })

    all.push(...features)

    if (features.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return all
}

// ------------------------------
// NORMALIZER (reuse your logic)
// ------------------------------
function normalizeFeature(f: any, source: 'nibrs' | 'homicide') {
  const a = f.attributes ?? {}

  const districtRaw =
    source === 'nibrs' ? a.New_District : a.DISTRICT_1

  const district =
    typeof districtRaw === 'string'
      ? districtRaw.trim().toUpperCase()
      : null

  const rawDate =
    source === 'nibrs' ? a.CrimeDateTime : a.Date_

  let date =
    typeof rawDate === 'string'
      ? Date.parse(rawDate)
      : typeof rawDate === 'number'
      ? rawDate
      : null

  if (isNaN(date as number)) date = null

  const description =
    source === 'homicide'
      ? a.NBRDESC || a.WEAPON || 'HOMICIDE'
      : a.Description || 'UNKNOWN'

  return {
    ...f,
    attributes: {
      ...a,
      New_District: district,
      CrimeDateTime: date,
      Description: description,
    },
  }
}

// ------------------------------
// MAIN BACKUP
// ------------------------------
async function runBackup() {
  const dateFilter = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 12)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')} 00:00:00`
  })()

  const whereNibrs = `CrimeDateTime >= DATE '${dateFilter}'`
  const whereHomicide = `Date_ >= DATE '${dateFilter}'`

  console.log('Fetching NIBRS...')
  const nibrs = await queryAllPages(BASE, whereNibrs)

  console.log('Fetching Homicides...')
  const homicides = await queryAllPages(HOMICIDES_BASE, whereHomicide).catch(
    () => []
  )

  console.log('Normalizing...')
  const features = [
    ...nibrs.map((f) => normalizeFeature(f, 'nibrs')),
    ...homicides.map((f) => normalizeFeature(f, 'homicide')),
  ]

  const output = {
    generatedAt: new Date().toISOString(),
    count: features.length,
    features,
  }

  console.log(`Writing ${features.length} records...`)

  await fs.writeFile(
    './public/data/crime-backup.json',
    JSON.stringify(output, null, 2)
  )

  console.log('Backup complete ✔')
}

runBackup().catch((err) => {
  console.error('Backup failed:', err)
  process.exit(1)
})