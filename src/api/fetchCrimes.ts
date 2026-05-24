// The app fetches two ArcGIS feature layers: one for general NIBRS crime data,
// and a second layer for homicide/shooting incidents.
const BASE = 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/NIBRS_GroupA_Crime_Data/FeatureServer/0/query'
const HOMICIDES_BASE = 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Homicides_Shootings_YTD/FeatureServer/0/query'

function getPastDateString(monthsAgo = 12): string {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 00:00:00`
}

// Build a date filter string for the ArcGIS query.

async function queryArcGISUrl(base: string, params: Record<string, string>) {
  const res = await fetch(`${base}?${new URLSearchParams(params)}`)
  if (!res.ok) throw new Error(`ArcGIS error: ${res.status}`)
  const data = await res.json()
  if (!data.features) throw new Error(`No features: ${JSON.stringify(data)}`)
  return data.features
}

// Fetch all pages from ArcGIS by paging through the results.

export interface CrimeData {
  heatPoints: [number, number, number][]
  features: any[]
  districts: string[]
  codes: { code: string; description: string }[]
}

async function queryAllPages(base: string, where: string): Promise<any[]> {
  const PAGE_SIZE = 1000
  let offset = 0
  let allFeatures: any[] = []

  while (true) {
    const features = await queryArcGISUrl(base, {
      where,
      outFields: '*',
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      f: 'json',
    })
    allFeatures = allFeatures.concat(features)
    if (features.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return allFeatures
}

// Pull both datasets together and normalize the fields so the rest of the app can treat them uniformly.

export async function fetchAllCrimeData(
  crimeCode?: string,
  district?: string
): Promise<CrimeData> {
  const dateFilter = getPastDateString(12)
  
  const nibrsConditions = [`CrimeDateTime >= DATE '${dateFilter}'`]
  const homicideConditions = [`CrimeTime >= DATE '${dateFilter}'`]

  if (crimeCode) {
    const codeValues = crimeCode.split(',').map(c => c.trim()).filter(Boolean);
    if (codeValues.length === 1) {
      const escaped = codeValues[0].replace(/'/g, `''`);
      nibrsConditions.push(`CrimeCode='${escaped}'`)
      homicideConditions.push(`CrimeCode='${escaped}'`)
    } else if (codeValues.length > 1) {
      const escapedList = codeValues.map(c => `'${c.replace(/'/g, `''`)}'`).join(',');
      nibrsConditions.push(`CrimeCode IN (${escapedList})`)
      homicideConditions.push(`CrimeCode IN (${escapedList})`)
    }
  }

  if (district) {
    nibrsConditions.push(`New_District='${district}'`)
    homicideConditions.push(`District='${district.toUpperCase()}'`) 
  }

  const [nibrsFeatures, homicideFeatures] = await Promise.all([
    queryAllPages(BASE, nibrsConditions.join(' AND ')),
    queryAllPages(HOMICIDES_BASE, homicideConditions.join(' AND ')).catch((err) => {
      console.warn('Homicides endpoint configuration mismatch fallback:', err)
      return [] as any[]
    }),
  ])

  // The homicide layer can have slightly different field names, so normalize them.

  // Complete data normalization to prevent slider/filtering loops from crashing
  const normalizedHomicides = homicideFeatures.map((f: any) => {
    if (f.attributes) {
      // Normalize different district fields onto the shared `New_District` property.
      if (f.attributes.District && !f.attributes.New_District) {
        f.attributes.New_District = f.attributes.District
      }
      // Normalize the timestamp field so the slider can use it consistently.
      if (f.attributes.CrimeTime && !f.attributes.CrimeDateTime) {
        f.attributes.CrimeDateTime = f.attributes.CrimeTime
      }
      // Some homicide records arrive without a description, so give them a safe fallback.
      if (!f.attributes.Description) {
        f.attributes.Description = 'HOMICIDE / SHOOTING'
      }
    }
    return f
  })

  const features = [...nibrsFeatures, ...normalizedHomicides]

  const heatPoints: [number, number, number][] = features
    .filter((f: any) => f.geometry && f.geometry.x && f.geometry.y)
    .map((f: any) => [f.geometry.y, f.geometry.x, 1.0])

  const seenDescriptions = new Map<string, string>()
  const seenDistricts = new Set<string>()

  for (const f of features) {
    if (!f.attributes) continue
    const { CrimeCode, Description, New_District } = f.attributes
    
    if (Description && !seenDescriptions.has(Description)) {
      seenDescriptions.set(Description, CrimeCode || 'UNKNOWN')
    }
    
    if (New_District) {
      const cleanDistrict = New_District.trim().toUpperCase()
      // Filter out invalid variations or blank entries from building wrong selector items
      if (cleanDistrict && cleanDistrict !== 'UNKNOWN' && cleanDistrict !== 'NULL') {
        seenDistricts.add(cleanDistrict)
      }
    }
  }

  const codes = Array.from(seenDescriptions.entries())
    .map(([description, code]) => ({ code, description }))
    .sort((a, b) => a.description.localeCompare(b.description))

  const districts = Array.from(seenDistricts).sort()

  return { heatPoints, features, codes, districts }
}