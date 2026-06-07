import type { DatasetRecord } from './types';

export interface FilterState {
  query: string;
  facets: Partial<Record<'species' | 'diseases' | 'tissues' | 'sequencingTypes' | 'sourceType' | 'downloadStatus', string[]>>;
}

function searchableText(record: DatasetRecord): string {
  return [
    record.title,
    record.summary,
    record.sourceType,
    record.accessions.join(' '),
    record.species.join(' '),
    record.diseases.join(' '),
    record.tissues.join(' '),
    record.sequencingTypes.join(' '),
    record.technologyTags.join(' '),
    record.downloadStatus,
    record.notes,
    record.publication.pmid,
    record.publication.doi,
    record.publication.title,
    record.publication.journal,
    record.publication.year?.toString(),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function valuesForFacet(record: DatasetRecord, key: keyof FilterState['facets']): string[] {
  if (key === 'sourceType') return [record.sourceType];
  if (key === 'downloadStatus') return record.downloadStatus ? [record.downloadStatus] : [];
  return record[key] ?? [];
}

export function filterDatasets(records: DatasetRecord[], state: FilterState): DatasetRecord[] {
  const query = state.query.trim().toLowerCase();
  return records.filter((record) => {
    if (query && !searchableText(record).includes(query)) return false;
    for (const [key, selected] of Object.entries(state.facets) as [keyof FilterState['facets'], string[]][]) {
      if (selected.length === 0) continue;
      const recordValues = valuesForFacet(record, key);
      if (!selected.some((value) => recordValues.includes(value))) return false;
    }
    return true;
  });
}

export function orderDatasetsForDisplay(records: DatasetRecord[]): DatasetRecord[] {
  return [...records].reverse();
}

