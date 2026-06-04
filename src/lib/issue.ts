import type { RawDatasetRecord } from './types';

export interface IssueDraft {
  title: string;
  body: string;
  url: string;
}

const csvHeader = [
  'id', 'title', 'summary', 'source_type', 'accessions', 'data_links', 'species', 'diseases', 'tissues',
  'sequencing_types', 'technology_tags', 'sample_count', 'download_status', 'notes', 'pmid', 'doi',
  'paper_title', 'journal', 'year', 'corresponding_author',
];

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function toCsvRow(record: RawDatasetRecord): string {
  return csvHeader.map((field) => escapeCsv(record[field as keyof RawDatasetRecord] ?? '')).join(',');
}

export function buildIssueDraft(owner: string, repo: string, record: RawDatasetRecord): IssueDraft {
  const title = `Add dataset: ${record.title || record.id}`;
  const csv = `${csvHeader.join(',')}\n${toCsvRow(record)}`;
  const body = `## Dataset record\n\n\`\`\`csv\n${csv}\n\`\`\`\n\n## JSON preview\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n\n## Notes\n\n${record.notes || 'No extra notes.'}\n`;
  const params = new URLSearchParams({ title, body });
  return { title, body, url: `https://github.com/${owner}/${repo}/issues/new?${params.toString()}` };
}
