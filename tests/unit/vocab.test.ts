import { describe, expect, it } from 'vitest';
import { createVocabularyIndex, normalizeControlledValue } from '../../src/lib/vocab';

const sequencingTypes = [
  { label: 'bulk RNA-seq', aliases: ['RNA-seq', 'bulk transcriptomics'] },
  { label: 'scRNA-seq', aliases: ['single-cell RNA-seq', 'single cell RNA-seq'] },
  { label: 'snRNA-seq', aliases: ['single-nucleus RNA-seq', 'single nucleus RNA-seq'] },
];

describe('controlled vocabulary normalization', () => {
  it('normalizes aliases to standard display labels', () => {
    const index = createVocabularyIndex(sequencingTypes);

    expect(normalizeControlledValue('single-cell RNA-seq', index)).toBe('scRNA-seq');
    expect(normalizeControlledValue(' snRNA-seq ', index)).toBe('snRNA-seq');
    expect(normalizeControlledValue('RNA-seq', index)).toBe('bulk RNA-seq');
  });

  it('returns undefined for unknown values', () => {
    const index = createVocabularyIndex(sequencingTypes);

    expect(normalizeControlledValue('unknown assay', index)).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    const index = createVocabularyIndex(sequencingTypes);

    expect(normalizeControlledValue('', index)).toBeUndefined();
  });

  it('rejects duplicate normalized keys that map to different labels', () => {
    expect(() => createVocabularyIndex([
      { label: 'lung', aliases: [] },
      { label: 'Lung tissue', aliases: ['lung'] },
    ])).toThrow('Duplicate vocabulary key');
  });
});
