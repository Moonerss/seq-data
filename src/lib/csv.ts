import Papa from 'papaparse';
import type { DataLink, RawDatasetRecord } from './types';
const expectedHeaders = [
  'id',
  'title',
  'summary',
  'source_type',
  'accessions',
  'data_links',
  'species',
  'diseases',
  'tissues',
  'sequencing_types',
  'technology_tags',
  'sample_count',
  'download_status',
  'notes',
  'pmid',
  'doi',
  'paper_title',
  'journal',
  'year',
  'corresponding_author',
] as const;

export function parseDatasetCsv(csvText: string): RawDatasetRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    const message = parsed.errors.map((error) => `${error.row}: ${error.message}`).join('; ');
    throw new Error(`CSV parse failed: ${message}`);
  }

  const headers = parsed.meta.fields ?? [];
  const missing = expectedHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required headers: ${missing.join(', ')}`);
  }

  return parsed.data.map((row) => {
    const normalized: Record<string, string> = {};
    for (const header of expectedHeaders) {
      normalized[header] = row[header] ?? '';
    }
    return normalized as unknown as RawDatasetRecord;
  });
}

export function splitMultiValue(value: string): string[] {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseDataLinks(value: string): DataLink[] {
  return splitMultiValue(value).map((entry) => {
    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) {
      return { label: 'Link', url: entry };
    }
    return {
      label: entry.slice(0, separatorIndex).trim(),
      url: entry.slice(separatorIndex + 1).trim(),
    };
  });
}