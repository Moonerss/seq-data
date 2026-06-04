import type { DatasetRecord } from './types';

export interface CountItem {
  label: string;
  count: number;
}

export interface CatalogStats {
  totalDatasets: number;
  diseaseCount: number;
  speciesCount: number;
  downloadedCount: number;
  sequencingTypeDistribution: CountItem[];
  diseaseTop10: CountItem[];
}

function countValues(values: string[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function computeStats(records: DatasetRecord[]): CatalogStats {
  const diseases = records.flatMap((record) => record.diseases);
  const species = records.flatMap((record) => record.species);
  const sequencingTypes = records.flatMap((record) => record.sequencingTypes);
  return {
    totalDatasets: records.length,
    diseaseCount: new Set(diseases).size,
    speciesCount: new Set(species).size,
    downloadedCount: records.filter((record) => record.downloadStatus === 'downloaded').length,
    sequencingTypeDistribution: countValues(sequencingTypes),
    diseaseTop10: countValues(diseases).slice(0, 10),
  };
}
