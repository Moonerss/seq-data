import { describe, expect, it } from 'vitest';
import type { DatasetRecord } from '../../src/lib/types';
import { filterDatasets } from '../../src/lib/search';

const records: DatasetRecord[] = [
  {
    id: 'ds_0001', title: 'Human lung fibrosis atlas', sourceType: 'GEO', accessions: ['GSE1'], dataLinks: [],
    species: ['Homo sapiens'], diseases: ['idiopathic pulmonary fibrosis'], tissues: ['lung'], sequencingTypes: ['scRNA-seq'],
    technologyTags: ['10x Genomics'], sampleCount: 10, downloadStatus: 'not downloaded', notes: 'fibroblast focus', publication: { journal: 'Nature', year: 2024 },
  },
  {
    id: 'ds_0002', title: 'Mouse liver injury', sourceType: 'Publication', accessions: [], dataLinks: [],
    species: ['Mus musculus'], diseases: ['liver injury'], tissues: ['liver'], sequencingTypes: ['bulk RNA-seq'],
    technologyTags: [], sampleCount: 8, downloadStatus: 'downloaded', notes: '', publication: { journal: 'Genome Biology', year: 2022 },
  },
];

describe('filterDatasets', () => {
  it('filters by keyword and facets', () => {
    const result = filterDatasets(records, {
      query: 'fibroblast',
      facets: { species: ['Homo sapiens'], sequencingTypes: ['scRNA-seq'] },
    });
    expect(result.map((record) => record.id)).toEqual(['ds_0001']);
  });

  it('uses OR logic within a facet and AND logic across facets', () => {
    const result = filterDatasets(records, {
      query: '',
      facets: { species: ['Homo sapiens', 'Mus musculus'], downloadStatus: ['downloaded'] },
    });
    expect(result.map((record) => record.id)).toEqual(['ds_0002']);
  });
});
