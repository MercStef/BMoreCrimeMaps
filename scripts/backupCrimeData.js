import fs from 'fs';
import path from 'path';

const BASE = 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/NIBRS_GroupA_Crime_Data/FeatureServer/0/query';
const HOMICIDES_BASE = 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Homicides_Shootings_YTD/FeatureServer/0/query';
const BACKUP_FILE = path.resolve(process.cwd(), 'public', 'data', 'crime-backup.json');

function getPastDateString(monthsAgo = 12) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 00:00:00`;
}

async function queryArcGISUrl(base, params) {
  const url = `${base}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ArcGIS error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.features) {
    throw new Error(`No features in response from ${base}`);
  }
  return data.features;
}

async function queryAllPages(base, where) {
  const PAGE_SIZE = 1000;
  let offset = 0;
  let allFeatures = [];

  while (true) {
    const features = await queryArcGISUrl(base, {
      where,
      outFields: '*',
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
      f: 'json'
    });

    allFeatures = allFeatures.concat(features);
    if (features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allFeatures;
}

async function main() {
  const dateFilter = getPastDateString(12);
  const nibrsWhere = `CrimeDateTime >= DATE '${dateFilter}'`;
  const homicideWhere = `CrimeTime >= DATE '${dateFilter}'`;

  console.log('Fetching NIBRS data...');
  const nibrsFeatures = await queryAllPages(BASE, nibrsWhere);

  console.log('Fetching homicide data...');
  const homicideFeatures = await queryAllPages(HOMICIDES_BASE, homicideWhere).catch((err) => {
    console.warn('Homicides endpoint failed:', err.message);
    return [];
  });

  const backupPayload = {
    fetchedAt: new Date().toISOString(),
    nibrsCount: nibrsFeatures.length,
    homicideCount: homicideFeatures.length,
    features: [...nibrsFeatures, ...homicideFeatures]
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupPayload, null, 2), 'utf-8');
  console.log(`Backup saved to ${BACKUP_FILE}`);
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
