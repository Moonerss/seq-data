export interface VocabularyEntry {
  label: string;
  aliases?: string[];
  ontologyId?: string;
}

export type VocabularyIndex = Map<string, string>;

function key(value: string): string {
  return value.trim().toLowerCase();
}

function addIndexValue(index: VocabularyIndex, rawValue: string, label: string): void {
  const normalizedKey = key(rawValue);
  const existing = index.get(normalizedKey);
  if (existing && existing !== label) {
    throw new Error(`Duplicate vocabulary key "${rawValue}" maps to both "${existing}" and "${label}"`);
  }
  index.set(normalizedKey, label);
}

export function createVocabularyIndex(entries: VocabularyEntry[]): VocabularyIndex {
  const index = new Map<string, string>();

  for (const entry of entries) {
    addIndexValue(index, entry.label, entry.label);
    for (const alias of entry.aliases ?? []) {
      addIndexValue(index, alias, entry.label);
    }
  }

  return index;
}

export function normalizeControlledValue(value: string, index: VocabularyIndex): string | undefined {
  return index.get(key(value));
}
