import { describe, expect, it } from 'vitest';
import { parseDatasetCsv } from '../../src/lib/csv';
import { buildDatasets } from '../../src/lib/builddataset';
import { appendDatasetRecordFromIssueBody } from '../../src/lib/issue-ingest';
import { defaultVocabularies } from '../../src/lib/validate';

const header = 'id,title,summary,source_type,accessions,data_links,species,diseases,tissues,sequencing_types,technology_tags,sample_count,download_status,notes,pmid,doi,paper_title,journal,year,corresponding_author';
const existingRow = 'ds_0001,Existing dataset,summary,GEO,GSE1,GEO=https://example.org,Homo sapiens,normal control,lung,bulk RNA-seq,,2,downloaded,notes,,,,Nature,2024,Lab';
const newRow = 'ds_0002,New dataset,summary,GEO,GSE2,GEO=https://example.org/geo,Homo sapiens,lung adenocarcinoma,lung,scRNA-seq,10x Genomics,4,not downloaded,reviewed,123,10.1234/example,Paper,Nature,2025,Lab';
const nsclcRow = 'ds_0002,NSCLC scRNA-seq,summary,GEO,GSE123456,GEO=https://example.org,HUMAN,NSCLC,LUNG,scRNA-seq,,10,not downloaded,,,,,,2026,';

function issueBody(row: string): string {
  return `## Dataset record\n\n\`\`\`csv\n${header}\n${row}\n\`\`\`\n\n## Notes\nreviewed`;
}

describe('appendDatasetRecordFromIssueBody', () => {
  it('extracts one CSV record from an issue body and appends it to datasets CSV', () => {
    const csv = `${header}\n${existingRow}\n`;

    const updated = appendDatasetRecordFromIssueBody(csv, issueBody(newRow));

    const rows = parseDatasetCsv(updated);
    expect(rows).toHaveLength(2);
    expect(rows[1].id).toBe('ds_0002');
    expect(rows[1].sequencing_types).toBe('scRNA-seq');
  });

  it('rejects duplicate dataset IDs before appending', () => {
    const csv = `${header}\n${existingRow}\n`;

    expect(() => appendDatasetRecordFromIssueBody(csv, issueBody(existingRow))).toThrow(/Duplicate dataset id/);
  });

  it('keeps web form submissions compatible with catalog validation', () => {
    const csv = `${header}\n${existingRow}\n`;

    const updated = appendDatasetRecordFromIssueBody(csv, issueBody(nsclcRow));
    const rows = parseDatasetCsv(updated);
    const result = buildDatasets(rows, defaultVocabularies);

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.value?.[1].species).toEqual(['Homo sapiens']);
    expect(result.value?.[1].diseases).toEqual(['non-small cell lung cancer']);
    expect(result.value?.[1].tissues).toEqual(['lung']);
  });
});
