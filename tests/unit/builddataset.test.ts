import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDatasetCsv } from '../../src/lib/csv';
import { buildDatasets } from '../../src/lib/builddataset';
import { defaultVocabularies } from '../../src/lib/validate';

const csv = readFileSync('tests/fixtures/datasets.valid.csv', 'utf8');

describe('buildDatasets', () => {
  it('builds normalized dataset records from CSV rows', () => {
    const rows = parseDatasetCsv(csv);
    const result = buildDatasets(rows, defaultVocabularies);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.value?.[0].sequencingTypes).toEqual(['scRNA-seq']);
    expect(result.value?.[0].diseases).toEqual(['idiopathic pulmonary fibrosis', 'normal control']);
    expect(result.value?.[0].dataLinks).toEqual([
      { label: 'GEO', url: 'https://example.org/geo' },
      { label: 'Paper', url: 'https://example.org/paper' },
    ]);
    expect(result.value?.[0].publication.year).toBe(2024);
  });

  it('allows unknown disease and tissue values while preserving them as free text', () => {
    const rows = parseDatasetCsv([
      'id,title,summary,source_type,accessions,data_links,species,diseases,tissues,sequencing_types,technology_tags,sample_count,download_status,notes,pmid,doi,paper_title,journal,year,corresponding_author',
      'ds_unknown,Unknown phenotype dataset,summary,GEO,GSE999,GEO=https://example.org,Homo sapiens,rare sarcoma subtype,metastatic lymph node,scRNA-seq,,5,not downloaded,,,,,,2024,'
    ].join('\n'));

    const result = buildDatasets(rows, defaultVocabularies);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.value?.[0].diseases).toEqual(['rare sarcoma subtype']);
    expect(result.value?.[0].tissues).toEqual(['metastatic lymph node']);
  });
});
