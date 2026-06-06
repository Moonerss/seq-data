import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDatasetCsv } from '../../src/lib/csv';
import { buildDatasets } from '../../src/lib/builddataset';
import { defaultVocabularies } from '../../src/lib/validate';

describe('dataset validation', () => {
  it('reports row-level validation issues', () => {
    const rows = parseDatasetCsv(readFileSync('tests/fixtures/datasets.invalid.csv', 'utf8'));
    const result = buildDatasets(rows, defaultVocabularies);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: 'source_type' }),
      expect.objectContaining({ row: 2, field: 'sequencing_types' }),
      expect.objectContaining({ row: 2, field: 'sample_count' }),
      expect.objectContaining({ row: 2, field: 'pmid' }),
      expect.objectContaining({ row: 2, field: 'doi' }),
      expect.objectContaining({ row: 2, field: 'year' }),
      expect.objectContaining({ row: 3, field: 'id' }),
    ]));
  });
});
