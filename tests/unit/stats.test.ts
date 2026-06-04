import { describe, expect, it } from 'vitest';
import type { DatasetRecord } from '../../src/lib/types';
import { computeStats } from '../../src/lib/stats';

const records: DatasetRecord[] = [
  { id: 'a', title: 'A', sourceType: 'GEO', accessions: [], dataLinks: [], species: ['Homo sapiens'], diseases: ['IPF'], tissues: ['lung'], sequencingTypes: ['scRNA-seq'], technologyTags: [], downloadStatus: 'downloaded', publication: {} },
  { id: 'b', title: 'B', sourceType: 'GEO', accessions: [], dataLinks: [], species: ['Homo sapiens'], diseases: ['IPF'], tissues: ['lung'], sequencingTypes: ['bulk RNA-seq'], technologyTags: [], downloadStatus: 'not downloaded', publication: {} },
  { id: 'c', title: 'C', sourceType: 'TCGA', accessions: [], dataLinks: [], species: ['Mus musculus'], diseases: ['liver injury'], tissues: ['liver'], sequencingTypes: ['bulk RNA-seq'], technologyTags: [], publication: {} },
];

describe('computeStats', () => {
  it('computes summary cards and distributions', () => {
    const stats = computeStats(records);
    expect(stats.totalDatasets).toBe(3);
    expect(stats.diseaseCount).toBe(2);
    expect(stats.speciesCount).toBe(2);
    expect(stats.downloadedCount).toBe(1);
    expect(stats.sequencingTypeDistribution).toEqual([
      { label: 'bulk RNA-seq', count: 2 },
      { label: 'scRNA-seq', count: 1 },
    ]);
    expect(stats.diseaseTop10[0]).toEqual({ label: 'IPF', count: 2 });
  });
});
