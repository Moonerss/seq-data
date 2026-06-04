import { parseDataLinks, splitMultiValue } from './csv';
import type { DatasetRecord, RawDatasetRecord, ValidationIssue, ValidationResult } from './types';
import { createVocabularyIndex, normalizeControlledValue, type VocabularyIndex } from './vocab';
import type { CatalogVocabularies } from './validate';

function issue(row: number, field: string, message: string): ValidationIssue {
  return { row, field, message };
}

function normalizeList(rowNumber: number, field: string, value: string, index: VocabularyIndex, issues: ValidationIssue[]): string[] {
  return splitMultiValue(value).map((item) => {
    const normalized = normalizeControlledValue(item, index);
    if (!normalized) {
      issues.push(issue(rowNumber, field, `Unknown value: ${item}`));
      return item;
    }
    return normalized;
  });
}

function parsePositiveInteger(rowNumber: number, field: string, value: string, issues: ValidationIssue[]): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    issues.push(issue(rowNumber, field, 'Expected a positive integer'));
    return undefined;
  }
  return parsed;
}

function parseYear(rowNumber: number, value: string, issues: ValidationIssue[]): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  const currentYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(parsed) || parsed < 1900 || parsed > currentYear) {
    issues.push(issue(rowNumber, 'year', 'Expected a plausible publication year'));
    return undefined;
  }
  return parsed;
}

function validateUrl(rowNumber: number, field: string, url: string, issues: ValidationIssue[]): void {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      issues.push(issue(rowNumber, field, `Unsupported URL protocol: ${url}`));
    }
  } catch {
    issues.push(issue(rowNumber, field, `Invalid URL: ${url}`));
  }
}

export function buildDatasets(rows: RawDatasetRecord[], vocabularies: CatalogVocabularies): ValidationResult<DatasetRecord[]> {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();
  const speciesIndex = createVocabularyIndex(vocabularies.species);
  const diseaseIndex = createVocabularyIndex(vocabularies.diseases);
  const tissueIndex = createVocabularyIndex(vocabularies.tissues);
  const sequencingIndex = createVocabularyIndex(vocabularies.sequencingTypes);
  const sourceIndex = createVocabularyIndex(vocabularies.sourceTypes);
  const statusIndex = createVocabularyIndex(vocabularies.downloadStatuses);

  const datasets = rows.map((row, index) => {
    const rowNumber = index + 2;

    if (!row.id) issues.push(issue(rowNumber, 'id', 'Required field is missing'));
    if (seenIds.has(row.id)) issues.push(issue(rowNumber, 'id', `Duplicate id: ${row.id}`));
    seenIds.add(row.id);
    if (!row.title) issues.push(issue(rowNumber, 'title', 'Required field is missing'));

    const sourceType = normalizeControlledValue(row.source_type, sourceIndex);
    if (!sourceType) issues.push(issue(rowNumber, 'source_type', `Unknown source type: ${row.source_type}`));

    const dataLinks = parseDataLinks(row.data_links);
    for (const link of dataLinks) validateUrl(rowNumber, 'data_links', link.url, issues);

    if (!row.accessions && dataLinks.length === 0 && !row.doi && !row.pmid) {
      issues.push(issue(rowNumber, 'accessions', 'At least one traceability field is required'));
    }

    if (row.pmid && !/^\d+$/.test(row.pmid)) issues.push(issue(rowNumber, 'pmid', 'PMID must contain only digits'));
    if (row.doi && !/^10\.\S+\/\S+$/.test(row.doi)) issues.push(issue(rowNumber, 'doi', 'DOI format is invalid'));

    const downloadStatus = row.download_status ? normalizeControlledValue(row.download_status, statusIndex) : undefined;
    if (row.download_status && !downloadStatus) issues.push(issue(rowNumber, 'download_status', `Unknown status: ${row.download_status}`));

    return {
      id: row.id,
      title: row.title,
      summary: row.summary || undefined,
      sourceType: sourceType ?? row.source_type,
      accessions: splitMultiValue(row.accessions),
      dataLinks,
      species: normalizeList(rowNumber, 'species', row.species, speciesIndex, issues),
      diseases: normalizeList(rowNumber, 'diseases', row.diseases, diseaseIndex, issues),
      tissues: normalizeList(rowNumber, 'tissues', row.tissues, tissueIndex, issues),
      sequencingTypes: normalizeList(rowNumber, 'sequencing_types', row.sequencing_types, sequencingIndex, issues),
      technologyTags: splitMultiValue(row.technology_tags),
      sampleCount: parsePositiveInteger(rowNumber, 'sample_count', row.sample_count, issues),
      downloadStatus,
      notes: row.notes || undefined,
      publication: {
        pmid: row.pmid || undefined,
        doi: row.doi || undefined,
        title: row.paper_title || undefined,
        journal: row.journal || undefined,
        year: parseYear(rowNumber, row.year, issues),
        correspondingAuthor: row.corresponding_author || undefined,
      },
    } satisfies DatasetRecord;
  });

  return { ok: issues.length === 0, value: issues.length === 0 ? datasets : undefined, issues };
}
