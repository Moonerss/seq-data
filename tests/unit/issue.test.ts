import { describe, expect, it } from 'vitest';
import type { RawDatasetRecord } from '../../src/lib/types';
import { buildIssueDraft } from '../../src/lib/issue';

const record: RawDatasetRecord = {
  id: 'ds_0003', title: 'Example dataset', summary: 'summary', source_type: 'GEO', accessions: 'GSE3',
  data_links: 'GEO=https://example.org/geo', species: 'Homo sapiens', diseases: 'normal control', tissues: 'lung',
  sequencing_types: 'scRNA-seq', technology_tags: '10x Genomics', sample_count: '4', download_status: 'not downloaded',
  notes: 'review this dataset', pmid: '123', doi: '10.1234/example', paper_title: 'Paper', journal: 'Nature', year: '2024', corresponding_author: 'Lab',
};

describe('buildIssueDraft', () => {
  it('builds an encoded GitHub issue URL and copyable body', () => {
    const draft = buildIssueDraft('owner', 'repo', record);
    expect(draft.title).toBe('Add dataset: Example dataset');
    expect(draft.body).toContain('## Dataset record');
    expect(draft.body).toContain('ds_0003');
    expect(draft.url).toContain('https://github.com/owner/repo/issues/new');
    expect(decodeURIComponent(draft.url.replaceAll('+', ' '))).toContain('Add dataset: Example dataset');
  });
});