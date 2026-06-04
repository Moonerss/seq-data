# Sequencing Dataset Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, GitHub Pages-compatible sequencing dataset catalog that reads curated CSV metadata, validates and encrypts it, then renders a password-unlocked searchable dashboard and table.

**Architecture:** Use a Vite + TypeScript static frontend. Keep curated biological metadata in `data/datasets.csv`; Node scripts validate CSV, normalize controlled vocabulary aliases, build temporary JSON, encrypt it to `public/datasets.enc.json`, and prevent plaintext data from being published.

**Tech Stack:** Node.js 24, npm, Vite, TypeScript, Vitest, Papa Parse, Web Crypto API, GitHub Actions, static GitHub Pages deployment.

---

## File structure

Create this repository structure:

```text
.github/workflows/ci.yml
.gitignore
package.json
tsconfig.json
vite.config.ts
index.html
data/datasets.csv
data/vocabularies/species.json
data/vocabularies/diseases.json
data/vocabularies/tissues.json
data/vocabularies/sequencing_types.json
data/vocabularies/source_type.json
data/vocabularies/download_status.json
scripts/build-data.ts
scripts/encrypt-data.ts
src/main.ts
src/styles.css
src/lib/types.ts
src/lib/csv.ts
src/lib/vocab.ts
src/lib/validate.ts
src/lib/buildDataset.ts
src/lib/crypto.ts
src/lib/search.ts
src/lib/stats.ts
src/lib/issue.ts
src/components/App.ts
src/components/UnlockView.ts
src/components/Dashboard.ts
src/components/Filters.ts
src/components/DatasetTable.ts
src/components/AddDatasetForm.ts
tests/fixtures/datasets.valid.csv
tests/fixtures/datasets.invalid.csv
tests/unit/vocab.test.ts
tests/unit/validate.test.ts
tests/unit/buildDataset.test.ts
tests/unit/crypto.test.ts
tests/unit/search.test.ts
tests/unit/stats.test.ts
tests/unit/issue.test.ts
```

Responsibilities:

- `data/`: private curated source metadata and controlled vocabularies.
- `scripts/`: command-line build and encryption entry points.
- `src/lib/`: pure functions for parsing, validation, normalization, encryption, search, statistics, and issue generation.
- `src/components/`: small DOM-rendering components. Each component returns an `HTMLElement` and owns one UI section.
- `tests/`: Vitest tests and CSV fixtures.

---

### Task 1: Project scaffold and test runner

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/styles.css`

- [ ] **Step 1: Create the npm package manifest**

Create `package.json`:

```json
{
  "name": "sequencing-dataset-catalog",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "build:data": "tsx scripts/build-data.ts",
    "encrypt:data": "tsx scripts/encrypt-data.ts",
    "build": "npm run test && npm run typecheck && npm run build:data && npm run encrypt:data && vite build"
  },
  "dependencies": {
    "@vitejs/plugin-basic-ssl": "latest",
    "papaparse": "latest",
    "vite": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/papaparse": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "scripts", "tests", "vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Create the HTML entry point and placeholder app**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sequencing Dataset Catalog</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create `src/main.ts`:

```ts
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root #app was not found');
}

root.innerHTML = `
  <main class="shell">
    <h1>Sequencing Dataset Catalog</h1>
    <p>A private searchable catalog for public sequencing datasets.</p>
  </main>
`;
```

Create `src/styles.css`:

```css
:root {
  color: #172033;
  background: #f6f8fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
build/
public/datasets.enc.json
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: npm installs dependencies and creates `package-lock.json`.

- [ ] **Step 5: Verify the empty scaffold**

Run:

```bash
npm run typecheck
npm test
```

Expected: typecheck passes and Vitest exits successfully with no tests or reports no matching tests depending on Vitest version. If Vitest exits because no tests exist, continue; tests are added in later tasks.

- [ ] **Step 6: Commit scaffold**

```bash
git add .
git commit -m "chore: scaffold sequencing dataset catalog"
```

Expected: commit succeeds. If this workspace is not a git repository, skip the commit and record that commits were unavailable.

---

### Task 2: Define domain types and CSV parsing

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/csv.ts`
- Create: `tests/fixtures/datasets.valid.csv`
- Create: `tests/unit/buildDataset.test.ts`

- [ ] **Step 1: Write fixture CSV**

Create `tests/fixtures/datasets.valid.csv`:

```csv
id,title,summary,source_type,accessions,data_links,species,diseases,tissues,sequencing_types,technology_tags,sample_count,download_status,notes,pmid,doi,paper_title,journal,year,corresponding_author
ds_0001,Single-cell atlas of human lung fibrosis,scRNA-seq of IPF and control lung tissues,GEO,GSE12345,GEO=https://example.org/geo; Paper=https://example.org/paper,Homo sapiens,idiopathic pulmonary fibrosis; normal control,lung,scRNA-seq,10x Genomics; Illumina NovaSeq,32,not downloaded,Only fibroblast-enriched samples are relevant.,34567890,10.1038/example,A single-cell atlas of lung fibrosis,Nature,2024,Zhang Lab
ds_0002,Mouse liver bulk RNA-seq,Mouse liver injury time course,Publication,,Supplement=https://example.org/supplement,Mus musculus,liver injury,liver,bulk RNA-seq,paired-end,18,downloaded,Publication-only source.,,,,Genome Biology,2022,Lee Lab
```

- [ ] **Step 2: Write failing CSV parsing test**

Create `tests/unit/buildDataset.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDatasetCsv } from '../../src/lib/csv';

const csv = readFileSync('tests/fixtures/datasets.valid.csv', 'utf8');

describe('parseDatasetCsv', () => {
  it('parses CSV rows into raw dataset records', () => {
    const rows = parseDatasetCsv(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('ds_0001');
    expect(rows[0].sequencing_types).toBe('scRNA-seq');
    expect(rows[1].source_type).toBe('Publication');
  });
});
```

- [ ] **Step 3: Run the failing test**

Run:

```bash
npm test -- tests/unit/buildDataset.test.ts
```

Expected: FAIL because `src/lib/csv.ts` does not exist.

- [ ] **Step 4: Add domain types**

Create `src/lib/types.ts`:

```ts
export interface RawDatasetRecord {
  id: string;
  title: string;
  summary: string;
  source_type: string;
  accessions: string;
  data_links: string;
  species: string;
  diseases: string;
  tissues: string;
  sequencing_types: string;
  technology_tags: string;
  sample_count: string;
  download_status: string;
  notes: string;
  pmid: string;
  doi: string;
  paper_title: string;
  journal: string;
  year: string;
  corresponding_author: string;
}

export interface DataLink {
  label: string;
  url: string;
}

export interface Publication {
  pmid?: string;
  doi?: string;
  title?: string;
  journal?: string;
  year?: number;
  correspondingAuthor?: string;
}

export interface DatasetRecord {
  id: string;
  title: string;
  summary?: string;
  sourceType: string;
  accessions: string[];
  dataLinks: DataLink[];
  species: string[];
  diseases: string[];
  tissues: string[];
  sequencingTypes: string[];
  technologyTags: string[];
  sampleCount?: number;
  downloadStatus?: string;
  notes?: string;
  publication: Publication;
}

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  issues: ValidationIssue[];
}
```

- [ ] **Step 5: Add CSV parser**

Create `src/lib/csv.ts`:

```ts
import Papa from 'papaparse';
import type { RawDatasetRecord } from './types';

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

export function parseDataLinks(value: string) {
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
```

- [ ] **Step 6: Run parser test**

Run:

```bash
npm test -- tests/unit/buildDataset.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit parser**

```bash
git add src/lib/types.ts src/lib/csv.ts tests/fixtures/datasets.valid.csv tests/unit/buildDataset.test.ts
git commit -m "feat: parse dataset CSV records"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 3: Controlled vocabularies and alias normalization

**Files:**
- Create: `data/vocabularies/species.json`
- Create: `data/vocabularies/diseases.json`
- Create: `data/vocabularies/tissues.json`
- Create: `data/vocabularies/sequencing_types.json`
- Create: `data/vocabularies/source_type.json`
- Create: `data/vocabularies/download_status.json`
- Create: `src/lib/vocab.ts`
- Create: `tests/unit/vocab.test.ts`

- [ ] **Step 1: Add vocabulary test**

Create `tests/unit/vocab.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run failing vocabulary test**

Run:

```bash
npm test -- tests/unit/vocab.test.ts
```

Expected: FAIL because `src/lib/vocab.ts` does not exist.

- [ ] **Step 3: Implement vocabulary helper**

Create `src/lib/vocab.ts`:

```ts
export interface VocabularyEntry {
  label: string;
  aliases?: string[];
  ontologyId?: string;
}

export type VocabularyIndex = Map<string, string>;

function key(value: string): string {
  return value.trim().toLowerCase();
}

export function createVocabularyIndex(entries: VocabularyEntry[]): VocabularyIndex {
  const index = new Map<string, string>();

  for (const entry of entries) {
    index.set(key(entry.label), entry.label);
    for (const alias of entry.aliases ?? []) {
      index.set(key(alias), entry.label);
    }
  }

  return index;
}

export function normalizeControlledValue(value: string, index: VocabularyIndex): string | undefined {
  return index.get(key(value));
}
```

- [ ] **Step 4: Add vocabulary JSON files**

Create `data/vocabularies/sequencing_types.json`:

```json
[
  { "label": "bulk RNA-seq", "aliases": ["RNA-seq", "bulk transcriptomics"] },
  { "label": "scRNA-seq", "aliases": ["single-cell RNA-seq", "single cell RNA-seq"] },
  { "label": "snRNA-seq", "aliases": ["single-nucleus RNA-seq", "single nucleus RNA-seq"] },
  { "label": "spatial transcriptomics", "aliases": ["spatial RNA-seq", "Visium", "Stereo-seq"] },
  { "label": "WGS", "aliases": ["whole-genome sequencing"] },
  { "label": "WES", "aliases": ["whole-exome sequencing"] },
  { "label": "ATAC-seq", "aliases": ["bulk ATAC-seq"] },
  { "label": "scATAC-seq", "aliases": ["single-cell ATAC-seq"] },
  { "label": "ChIP-seq", "aliases": ["chromatin immunoprecipitation sequencing"] },
  { "label": "CUT&Tag", "aliases": ["cleavage under targets and tagmentation"] },
  { "label": "CUT&RUN", "aliases": ["cleavage under targets and release using nuclease"] },
  { "label": "miRNA-seq", "aliases": ["microRNA sequencing"] },
  { "label": "metagenomics", "aliases": ["metagenomic sequencing"] },
  { "label": "long-read RNA-seq", "aliases": ["Iso-Seq", "Nanopore direct RNA"] },
  { "label": "long-read WGS", "aliases": ["PacBio HiFi WGS", "ONT WGS"] },
  { "label": "other", "aliases": [] }
]
```

Create `data/vocabularies/source_type.json`:

```json
[
  { "label": "GEO", "aliases": ["Gene Expression Omnibus"] },
  { "label": "SRA", "aliases": ["Sequence Read Archive"] },
  { "label": "ENA", "aliases": ["European Nucleotide Archive"] },
  { "label": "TCGA", "aliases": ["The Cancer Genome Atlas"] },
  { "label": "Publication", "aliases": ["Paper", "Article"] },
  { "label": "Zenodo", "aliases": [] },
  { "label": "Figshare", "aliases": [] },
  { "label": "Other", "aliases": [] }
]
```

Create `data/vocabularies/download_status.json`:

```json
[
  { "label": "not downloaded", "aliases": ["missing", "todo"] },
  { "label": "downloaded", "aliases": ["done"] },
  { "label": "partial", "aliases": ["partially downloaded"] },
  { "label": "unavailable", "aliases": ["link dead", "not available"] },
  { "label": "unknown", "aliases": [] }
]
```

Create `data/vocabularies/species.json`:

```json
[
  { "label": "Homo sapiens", "aliases": ["human", "人类"], "ontologyId": "NCBITaxon:9606" },
  { "label": "Mus musculus", "aliases": ["mouse", "小鼠"], "ontologyId": "NCBITaxon:10090" },
  { "label": "Rattus norvegicus", "aliases": ["rat", "大鼠"], "ontologyId": "NCBITaxon:10116" }
]
```

Create `data/vocabularies/diseases.json`:

```json
[
  { "label": "normal control", "aliases": ["control", "healthy"] },
  { "label": "idiopathic pulmonary fibrosis", "aliases": ["IPF"] },
  { "label": "lung adenocarcinoma", "aliases": ["LUAD"] },
  { "label": "liver injury", "aliases": [] }
]
```

Create `data/vocabularies/tissues.json`:

```json
[
  { "label": "lung", "aliases": [] },
  { "label": "peripheral blood", "aliases": ["blood", "PBMC"] },
  { "label": "liver", "aliases": [] },
  { "label": "tumor", "aliases": ["tumour"] }
]
```

- [ ] **Step 5: Run vocabulary tests**

Run:

```bash
npm test -- tests/unit/vocab.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit vocabularies**

```bash
git add data/vocabularies src/lib/vocab.ts tests/unit/vocab.test.ts
git commit -m "feat: add controlled vocabulary normalization"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 4: Dataset validation and JSON build model

**Files:**
- Create: `src/lib/validate.ts`
- Create: `src/lib/buildDataset.ts`
- Modify: `tests/unit/buildDataset.test.ts`
- Create: `tests/unit/validate.test.ts`
- Create: `tests/fixtures/datasets.invalid.csv`

- [ ] **Step 1: Replace build test with normalization expectations**

Replace `tests/unit/buildDataset.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDatasetCsv } from '../../src/lib/csv';
import { buildDatasets } from '../../src/lib/buildDataset';
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
});
```

- [ ] **Step 2: Add validation failure test**

Create `tests/fixtures/datasets.invalid.csv`:

```csv
id,title,summary,source_type,accessions,data_links,species,diseases,tissues,sequencing_types,technology_tags,sample_count,download_status,notes,pmid,doi,paper_title,journal,year,corresponding_author
ds_0001,Bad row,,UnknownSource,,,,unknown disease,lung,unknown assay,,not-a-number,done,,abc,not-a-doi,,,3024,
ds_0001,Duplicate row,,GEO,GSE99999,,Homo sapiens,normal control,lung,scRNA-seq,,1,downloaded,,,,,,2021,
```

Create `tests/unit/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDatasetCsv } from '../../src/lib/csv';
import { buildDatasets } from '../../src/lib/buildDataset';
import { defaultVocabularies } from '../../src/lib/validate';

describe('dataset validation', () => {
  it('reports row-level validation issues', () => {
    const rows = parseDatasetCsv(readFileSync('tests/fixtures/datasets.invalid.csv', 'utf8'));
    const result = buildDatasets(rows, defaultVocabularies);
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: 'source_type' }),
      expect.objectContaining({ row: 2, field: 'species' }),
      expect.objectContaining({ row: 2, field: 'sequencing_types' }),
      expect.objectContaining({ row: 2, field: 'sample_count' }),
      expect.objectContaining({ row: 2, field: 'pmid' }),
      expect.objectContaining({ row: 2, field: 'doi' }),
      expect.objectContaining({ row: 2, field: 'year' }),
      expect.objectContaining({ row: 3, field: 'id' }),
    ]));
  });
});
```

- [ ] **Step 3: Run failing validation tests**

Run:

```bash
npm test -- tests/unit/buildDataset.test.ts tests/unit/validate.test.ts
```

Expected: FAIL because validation modules do not exist.

- [ ] **Step 4: Implement validation vocabulary constants**

Create `src/lib/validate.ts`:

```ts
import type { VocabularyEntry } from './vocab';

export interface CatalogVocabularies {
  species: VocabularyEntry[];
  diseases: VocabularyEntry[];
  tissues: VocabularyEntry[];
  sequencingTypes: VocabularyEntry[];
  sourceTypes: VocabularyEntry[];
  downloadStatuses: VocabularyEntry[];
}

export const defaultVocabularies: CatalogVocabularies = {
  species: [
    { label: 'Homo sapiens', aliases: ['human', '人类'], ontologyId: 'NCBITaxon:9606' },
    { label: 'Mus musculus', aliases: ['mouse', '小鼠'], ontologyId: 'NCBITaxon:10090' },
    { label: 'Rattus norvegicus', aliases: ['rat', '大鼠'], ontologyId: 'NCBITaxon:10116' },
  ],
  diseases: [
    { label: 'normal control', aliases: ['control', 'healthy'] },
    { label: 'idiopathic pulmonary fibrosis', aliases: ['IPF'] },
    { label: 'lung adenocarcinoma', aliases: ['LUAD'] },
    { label: 'liver injury', aliases: [] },
  ],
  tissues: [
    { label: 'lung', aliases: [] },
    { label: 'peripheral blood', aliases: ['blood', 'PBMC'] },
    { label: 'liver', aliases: [] },
    { label: 'tumor', aliases: ['tumour'] },
  ],
  sequencingTypes: [
    { label: 'bulk RNA-seq', aliases: ['RNA-seq', 'bulk transcriptomics'] },
    { label: 'scRNA-seq', aliases: ['single-cell RNA-seq', 'single cell RNA-seq'] },
    { label: 'snRNA-seq', aliases: ['single-nucleus RNA-seq', 'single nucleus RNA-seq'] },
    { label: 'spatial transcriptomics', aliases: ['spatial RNA-seq', 'Visium', 'Stereo-seq'] },
    { label: 'WGS', aliases: ['whole-genome sequencing'] },
    { label: 'WES', aliases: ['whole-exome sequencing'] },
    { label: 'ATAC-seq', aliases: ['bulk ATAC-seq'] },
    { label: 'scATAC-seq', aliases: ['single-cell ATAC-seq'] },
    { label: 'ChIP-seq', aliases: ['chromatin immunoprecipitation sequencing'] },
    { label: 'CUT&Tag', aliases: ['cleavage under targets and tagmentation'] },
    { label: 'CUT&RUN', aliases: ['cleavage under targets and release using nuclease'] },
    { label: 'miRNA-seq', aliases: ['microRNA sequencing'] },
    { label: 'metagenomics', aliases: ['metagenomic sequencing'] },
    { label: 'long-read RNA-seq', aliases: ['Iso-Seq', 'Nanopore direct RNA'] },
    { label: 'long-read WGS', aliases: ['PacBio HiFi WGS', 'ONT WGS'] },
    { label: 'other', aliases: [] },
  ],
  sourceTypes: [
    { label: 'GEO', aliases: ['Gene Expression Omnibus'] },
    { label: 'SRA', aliases: ['Sequence Read Archive'] },
    { label: 'ENA', aliases: ['European Nucleotide Archive'] },
    { label: 'TCGA', aliases: ['The Cancer Genome Atlas'] },
    { label: 'Publication', aliases: ['Paper', 'Article'] },
    { label: 'Zenodo', aliases: [] },
    { label: 'Figshare', aliases: [] },
    { label: 'Other', aliases: [] },
  ],
  downloadStatuses: [
    { label: 'not downloaded', aliases: ['missing', 'todo'] },
    { label: 'downloaded', aliases: ['done'] },
    { label: 'partial', aliases: ['partially downloaded'] },
    { label: 'unavailable', aliases: ['link dead', 'not available'] },
    { label: 'unknown', aliases: [] },
  ],
};
```

- [ ] **Step 5: Implement dataset builder and validator**

Create `src/lib/buildDataset.ts`:

```ts
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
```

- [ ] **Step 6: Run validation tests**

Run:

```bash
npm test -- tests/unit/buildDataset.test.ts tests/unit/validate.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit builder and validator**

```bash
git add src/lib/validate.ts src/lib/buildDataset.ts tests/unit/buildDataset.test.ts tests/unit/validate.test.ts tests/fixtures/datasets.invalid.csv
git commit -m "feat: validate and build normalized dataset records"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 5: Build-data script

**Files:**
- Create: `data/datasets.csv`
- Create: `scripts/build-data.ts`

- [ ] **Step 1: Seed the main CSV**

Create `data/datasets.csv` with the same content as `tests/fixtures/datasets.valid.csv`.

- [ ] **Step 2: Create build script**

Create `scripts/build-data.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseDatasetCsv } from '../src/lib/csv';
import { buildDatasets } from '../src/lib/buildDataset';
import { defaultVocabularies } from '../src/lib/validate';

const inputPath = 'data/datasets.csv';
const outputPath = 'build/datasets.json';

const csv = readFileSync(inputPath, 'utf8');
const rows = parseDatasetCsv(csv);
const result = buildDatasets(rows, defaultVocabularies);

if (!result.ok || !result.value) {
  for (const item of result.issues) {
    console.error(`Row ${item.row}, ${item.field}: ${item.message}`);
  }
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(result.value, null, 2)}\n`);
console.log(`Wrote ${result.value.length} records to ${outputPath}`);
```

- [ ] **Step 3: Run build-data script**

Run:

```bash
npm run build:data
```

Expected: `build/datasets.json` is created and console prints `Wrote 2 records to build/datasets.json`.

- [ ] **Step 4: Commit build script**

```bash
git add data/datasets.csv scripts/build-data.ts
git commit -m "feat: build dataset JSON from curated CSV"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 6: Encryption and browser decryption

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `tests/unit/crypto.test.ts`
- Create: `scripts/encrypt-data.ts`

- [ ] **Step 1: Write encryption tests**

Create `tests/unit/crypto.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decryptPayload, encryptText } from '../../src/lib/crypto';

describe('dataset encryption', () => {
  it('decrypts with the correct password', async () => {
    const payload = await encryptText('secret data', 'correct horse battery staple');
    await expect(decryptPayload(payload, 'correct horse battery staple')).resolves.toBe('secret data');
  });

  it('rejects an incorrect password', async () => {
    const payload = await encryptText('secret data', 'correct horse battery staple');
    await expect(decryptPayload(payload, 'wrong password')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run failing crypto tests**

Run:

```bash
npm test -- tests/unit/crypto.test.ts
```

Expected: FAIL because `src/lib/crypto.ts` does not exist.

- [ ] **Step 3: Implement Web Crypto helpers**

Create `src/lib/crypto.ts`:

```ts
export interface EncryptedPayload {
  version: 1;
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
  algorithm: 'AES-GCM';
  iv: string;
  ciphertext: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 310000;
  const key = await deriveKey(password, salt, iterations);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext)));
  return {
    version: 1,
    kdf: 'PBKDF2',
    iterations,
    salt: bytesToBase64(salt),
    algorithm: 'AES-GCM',
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export async function decryptPayload(payload: EncryptedPayload, password: string): Promise<string> {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);
  const key = await deriveKey(password, salt, payload.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return decoder.decode(plaintext);
}
```

- [ ] **Step 4: Add encryption script**

Create `scripts/encrypt-data.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { encryptText } from '../src/lib/crypto';

const inputPath = 'build/datasets.json';
const outputPath = 'public/datasets.enc.json';
const password = process.env.DATASET_CATALOG_PASSWORD;

if (!password) {
  console.error('DATASET_CATALOG_PASSWORD is required');
  process.exit(1);
}

const plaintext = readFileSync(inputPath, 'utf8');
const encrypted = await encryptText(plaintext, password);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(encrypted, null, 2)}\n`);
console.log(`Encrypted ${inputPath} to ${outputPath}`);
```

- [ ] **Step 5: Run crypto tests**

Run:

```bash
npm test -- tests/unit/crypto.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run encryption script with a local password**

Run:

```bash
DATASET_CATALOG_PASSWORD='change-me-locally' npm run build:data
DATASET_CATALOG_PASSWORD='change-me-locally' npm run encrypt:data
```

Expected: `public/datasets.enc.json` is created; `build/datasets.json` exists only as local build artifact and is ignored by git.

- [ ] **Step 7: Commit crypto work**

```bash
git add src/lib/crypto.ts scripts/encrypt-data.ts tests/unit/crypto.test.ts
git commit -m "feat: encrypt dataset catalog for static deployment"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 7: Search, filtering, and statistics pure functions

**Files:**
- Create: `src/lib/search.ts`
- Create: `src/lib/stats.ts`
- Create: `tests/unit/search.test.ts`
- Create: `tests/unit/stats.test.ts`

- [ ] **Step 1: Write search tests**

Create `tests/unit/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { DatasetRecord } from '../../src/lib/types';
import { filterDatasets } from '../../src/lib/search';

const records: DatasetRecord[] = [
  {
    id: 'ds_0001', title: 'Human lung fibrosis atlas', sourceType: 'GEO', accessions: ['GSE1'], dataLinks: [],
    species: ['Homo sapiens'], diseases: ['idiopathic pulmonary fibrosis'], tissues: ['lung'], sequencingTypes: ['scRNA-seq'],
    technologyTags: ['10x Genomics'], sampleCount: 10, downloadStatus: 'not downloaded', notes: 'fibroblast focus', publication: { journal: 'Nature', year: 2024 },
  },
  {
    id: 'ds_0002', title: 'Mouse liver injury', sourceType: 'Publication', accessions: [], dataLinks: [],
    species: ['Mus musculus'], diseases: ['liver injury'], tissues: ['liver'], sequencingTypes: ['bulk RNA-seq'],
    technologyTags: [], sampleCount: 8, downloadStatus: 'downloaded', notes: '', publication: { journal: 'Genome Biology', year: 2022 },
  },
];

describe('filterDatasets', () => {
  it('filters by keyword and facets', () => {
    const result = filterDatasets(records, {
      query: 'fibroblast',
      facets: { species: ['Homo sapiens'], sequencingTypes: ['scRNA-seq'] },
    });
    expect(result.map((record) => record.id)).toEqual(['ds_0001']);
  });

  it('uses OR logic within a facet and AND logic across facets', () => {
    const result = filterDatasets(records, {
      query: '',
      facets: { species: ['Homo sapiens', 'Mus musculus'], downloadStatus: ['downloaded'] },
    });
    expect(result.map((record) => record.id)).toEqual(['ds_0002']);
  });
});
```

- [ ] **Step 2: Write stats tests**

Create `tests/unit/stats.test.ts`:

```ts
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
```

- [ ] **Step 3: Run failing search and stats tests**

Run:

```bash
npm test -- tests/unit/search.test.ts tests/unit/stats.test.ts
```

Expected: FAIL because `search.ts` and `stats.ts` do not exist.

- [ ] **Step 4: Implement search**

Create `src/lib/search.ts`:

```ts
import type { DatasetRecord } from './types';

export interface FilterState {
  query: string;
  facets: Partial<Record<'species' | 'diseases' | 'tissues' | 'sequencingTypes' | 'sourceType' | 'downloadStatus', string[]>>;
}

function searchableText(record: DatasetRecord): string {
  return [
    record.title,
    record.summary,
    record.sourceType,
    record.accessions.join(' '),
    record.species.join(' '),
    record.diseases.join(' '),
    record.tissues.join(' '),
    record.sequencingTypes.join(' '),
    record.technologyTags.join(' '),
    record.downloadStatus,
    record.notes,
    record.publication.pmid,
    record.publication.doi,
    record.publication.title,
    record.publication.journal,
    record.publication.year?.toString(),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function valuesForFacet(record: DatasetRecord, key: keyof FilterState['facets']): string[] {
  if (key === 'sourceType') return [record.sourceType];
  if (key === 'downloadStatus') return record.downloadStatus ? [record.downloadStatus] : [];
  return record[key] ?? [];
}

export function filterDatasets(records: DatasetRecord[], state: FilterState): DatasetRecord[] {
  const query = state.query.trim().toLowerCase();
  return records.filter((record) => {
    if (query && !searchableText(record).includes(query)) return false;
    for (const [key, selected] of Object.entries(state.facets) as [keyof FilterState['facets'], string[]][]) {
      if (selected.length === 0) continue;
      const recordValues = valuesForFacet(record, key);
      if (!selected.some((value) => recordValues.includes(value))) return false;
    }
    return true;
  });
}
```

- [ ] **Step 5: Implement stats**

Create `src/lib/stats.ts`:

```ts
import type { DatasetRecord } from './types';

export interface CountItem {
  label: string;
  count: number;
}

export interface CatalogStats {
  totalDatasets: number;
  diseaseCount: number;
  speciesCount: number;
  downloadedCount: number;
  sequencingTypeDistribution: CountItem[];
  diseaseTop10: CountItem[];
}

function countValues(values: string[]): CountItem[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function computeStats(records: DatasetRecord[]): CatalogStats {
  const diseases = records.flatMap((record) => record.diseases);
  const species = records.flatMap((record) => record.species);
  const sequencingTypes = records.flatMap((record) => record.sequencingTypes);
  return {
    totalDatasets: records.length,
    diseaseCount: new Set(diseases).size,
    speciesCount: new Set(species).size,
    downloadedCount: records.filter((record) => record.downloadStatus === 'downloaded').length,
    sequencingTypeDistribution: countValues(sequencingTypes),
    diseaseTop10: countValues(diseases).slice(0, 10),
  };
}
```

- [ ] **Step 6: Run search and stats tests**

Run:

```bash
npm test -- tests/unit/search.test.ts tests/unit/stats.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit search and stats**

```bash
git add src/lib/search.ts src/lib/stats.ts tests/unit/search.test.ts tests/unit/stats.test.ts
git commit -m "feat: add catalog search filters and statistics"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 8: GitHub Issue draft generation

**Files:**
- Create: `src/lib/issue.ts`
- Create: `tests/unit/issue.test.ts`

- [ ] **Step 1: Write issue generation test**

Create `tests/unit/issue.test.ts`:

```ts
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
    expect(decodeURIComponent(draft.url)).toContain('Add dataset: Example dataset');
  });
});
```

- [ ] **Step 2: Run failing issue test**

Run:

```bash
npm test -- tests/unit/issue.test.ts
```

Expected: FAIL because `src/lib/issue.ts` does not exist.

- [ ] **Step 3: Implement issue generator**

Create `src/lib/issue.ts`:

```ts
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
```

- [ ] **Step 4: Run issue tests**

Run:

```bash
npm test -- tests/unit/issue.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit issue generator**

```bash
git add src/lib/issue.ts tests/unit/issue.test.ts
git commit -m "feat: generate GitHub issue drafts for new datasets"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 9: Password unlock app shell

**Files:**
- Create: `src/components/UnlockView.ts`
- Create: `src/components/App.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create unlock component**

Create `src/components/UnlockView.ts`:

```ts
export interface UnlockViewOptions {
  onUnlock: (password: string) => Promise<void>;
}

export function UnlockView(options: UnlockViewOptions): HTMLElement {
  const section = document.createElement('section');
  section.className = 'unlock-card';
  section.innerHTML = `
    <h1>Sequencing Dataset Catalog</h1>
    <p>A private searchable catalog for public sequencing datasets.</p>
    <form class="unlock-form">
      <label>
        Password
        <input type="password" name="password" autocomplete="current-password" required />
      </label>
      <button type="submit">Unlock catalog</button>
    </form>
    <p class="error" hidden></p>
  `;

  const form = section.querySelector<HTMLFormElement>('form')!;
  const error = section.querySelector<HTMLParagraphElement>('.error')!;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    try {
      await options.onUnlock(password);
    } catch {
      error.textContent = '密码错误或数据文件损坏';
      error.hidden = false;
    }
  });

  return section;
}
```

- [ ] **Step 2: Create app shell**

Create `src/components/App.ts`:

```ts
import { decryptPayload, type EncryptedPayload } from '../lib/crypto';
import type { DatasetRecord } from '../lib/types';
import { UnlockView } from './UnlockView';

export function App(): HTMLElement {
  const container = document.createElement('main');
  container.className = 'shell';

  async function unlock(password: string): Promise<void> {
    const response = await fetch('/datasets.enc.json');
    if (!response.ok) throw new Error('Encrypted dataset file was not found');
    const encrypted = (await response.json()) as EncryptedPayload;
    const plaintext = await decryptPayload(encrypted, password);
    const records = JSON.parse(plaintext) as DatasetRecord[];
    container.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = `Unlocked ${records.length} datasets. Dashboard will be added next.`;
    container.append(pre);
  }

  container.append(UnlockView({ onUnlock: unlock }));
  return container;
}
```

- [ ] **Step 3: Wire app in main**

Replace `src/main.ts`:

```ts
import './styles.css';
import { App } from './components/App';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root #app was not found');
}

root.replaceChildren(App());
```

- [ ] **Step 4: Expand styles**

Append to `src/styles.css`:

```css
.unlock-card {
  max-width: 520px;
  margin: 12vh auto 0;
  padding: 32px;
  border: 1px solid #d9e2ef;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 50px rgba(24, 42, 70, 0.08);
}

.unlock-form {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.unlock-form label {
  display: grid;
  gap: 8px;
  font-weight: 600;
}

input, select, textarea, button {
  font: inherit;
}

input, select, textarea {
  border: 1px solid #c8d3e1;
  border-radius: 10px;
  padding: 10px 12px;
}

button {
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  padding: 11px 16px;
  color: white;
  background: #2563eb;
  font-weight: 700;
}

.error {
  color: #b42318;
  font-weight: 600;
}
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run typecheck
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit app shell**

```bash
git add src/components/UnlockView.ts src/components/App.ts src/main.ts src/styles.css
git commit -m "feat: add password unlock shell"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 10: Dashboard, filters, and table UI

**Files:**
- Create: `src/components/Dashboard.ts`
- Create: `src/components/Filters.ts`
- Create: `src/components/DatasetTable.ts`
- Modify: `src/components/App.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create dashboard component**

Create `src/components/Dashboard.ts`:

```ts
import { computeStats } from '../lib/stats';
import type { DatasetRecord } from '../lib/types';

function bar(label: string, count: number, max: number): string {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return `<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${count}</strong></div>`;
}

export function Dashboard(records: DatasetRecord[]): HTMLElement {
  const stats = computeStats(records);
  const section = document.createElement('section');
  section.className = 'dashboard';
  const maxDisease = Math.max(0, ...stats.diseaseTop10.map((item) => item.count));
  const maxType = Math.max(0, ...stats.sequencingTypeDistribution.map((item) => item.count));
  section.innerHTML = `
    <div class="stat-grid">
      <article><span>Total datasets</span><strong>${stats.totalDatasets}</strong></article>
      <article><span>Diseases</span><strong>${stats.diseaseCount}</strong></article>
      <article><span>Species</span><strong>${stats.speciesCount}</strong></article>
      <article><span>Downloaded</span><strong>${stats.downloadedCount}</strong></article>
    </div>
    <div class="chart-grid">
      <article><h2>Sequencing types</h2>${stats.sequencingTypeDistribution.map((item) => bar(item.label, item.count, maxType)).join('')}</article>
      <article><h2>Disease Top 10</h2>${stats.diseaseTop10.map((item) => bar(item.label, item.count, maxDisease)).join('')}</article>
    </div>
  `;
  return section;
}
```

- [ ] **Step 2: Create filters component**

Create `src/components/Filters.ts`:

```ts
import type { FilterState } from '../lib/search';
import type { DatasetRecord } from '../lib/types';

export interface FiltersOptions {
  records: DatasetRecord[];
  state: FilterState;
  onChange: (state: FilterState) => void;
}

function unique(records: DatasetRecord[], getter: (record: DatasetRecord) => string[]): string[] {
  return [...new Set(records.flatMap(getter))].sort((a, b) => a.localeCompare(b));
}

function select(name: string, label: string, values: string[], selected: string[]): string {
  return `<label>${label}<select name="${name}" multiple>${values.map((value) => `<option value="${value}" ${selected.includes(value) ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`;
}

export function Filters(options: FiltersOptions): HTMLElement {
  const form = document.createElement('form');
  form.className = 'filters';
  form.innerHTML = `
    <label class="search">Keyword search<input name="query" value="${options.state.query}" placeholder="fibrosis macrophage GSE..." /></label>
    ${select('diseases', 'Disease', unique(options.records, (r) => r.diseases), options.state.facets.diseases ?? [])}
    ${select('species', 'Species', unique(options.records, (r) => r.species), options.state.facets.species ?? [])}
    ${select('tissues', 'Tissue', unique(options.records, (r) => r.tissues), options.state.facets.tissues ?? [])}
    ${select('sequencingTypes', 'Sequencing type', unique(options.records, (r) => r.sequencingTypes), options.state.facets.sequencingTypes ?? [])}
    ${select('sourceType', 'Source', unique(options.records, (r) => [r.sourceType]), options.state.facets.sourceType ?? [])}
    ${select('downloadStatus', 'Download status', unique(options.records, (r) => r.downloadStatus ? [r.downloadStatus] : []), options.state.facets.downloadStatus ?? [])}
    <button type="reset">Reset filters</button>
  `;

  function readState(): FilterState {
    const data = new FormData(form);
    const readAll = (name: string) => data.getAll(name).map(String);
    return {
      query: String(data.get('query') ?? ''),
      facets: {
        diseases: readAll('diseases'),
        species: readAll('species'),
        tissues: readAll('tissues'),
        sequencingTypes: readAll('sequencingTypes'),
        sourceType: readAll('sourceType'),
        downloadStatus: readAll('downloadStatus'),
      },
    };
  }

  form.addEventListener('input', () => options.onChange(readState()));
  form.addEventListener('change', () => options.onChange(readState()));
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    options.onChange({ query: '', facets: {} });
  });
  return form;
}
```

- [ ] **Step 3: Create table component**

Create `src/components/DatasetTable.ts`:

```ts
import type { DatasetRecord } from '../lib/types';

function tags(values: string[]): string {
  return values.map((value) => `<span class="tag">${value}</span>`).join(' ');
}

function links(record: DatasetRecord): string {
  return record.dataLinks.map((link) => `<a href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`).join(' ');
}

export function DatasetTable(records: DatasetRecord[]): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'table-wrap';
  wrapper.innerHTML = `
    <h2>${records.length} matching datasets</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th><th>Source</th><th>Accessions</th><th>Disease</th><th>Species</th><th>Tissue</th>
          <th>Sequencing</th><th>Samples</th><th>Year</th><th>Status</th><th>Links</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${records.map((record) => `
          <tr>
            <td><strong>${record.title}</strong></td>
            <td>${record.sourceType}</td>
            <td>${tags(record.accessions)}</td>
            <td>${tags(record.diseases)}</td>
            <td>${tags(record.species)}</td>
            <td>${tags(record.tissues)}</td>
            <td>${tags(record.sequencingTypes)}</td>
            <td>${record.sampleCount ?? ''}</td>
            <td>${record.publication.year ?? ''}</td>
            <td>${record.downloadStatus ?? ''}</td>
            <td>${links(record)}</td>
            <td class="notes">${record.notes ?? ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  return wrapper;
}
```

- [ ] **Step 4: Wire dashboard into App**

Replace `src/components/App.ts`:

```ts
import { decryptPayload, type EncryptedPayload } from '../lib/crypto';
import { filterDatasets, type FilterState } from '../lib/search';
import type { DatasetRecord } from '../lib/types';
import { Dashboard } from './Dashboard';
import { DatasetTable } from './DatasetTable';
import { Filters } from './Filters';
import { UnlockView } from './UnlockView';

export function App(): HTMLElement {
  const container = document.createElement('main');
  container.className = 'shell';

  function renderCatalog(records: DatasetRecord[], state: FilterState): void {
    const filtered = filterDatasets(records, state);
    const header = document.createElement('header');
    header.className = 'page-header';
    header.innerHTML = '<h1>Sequencing Dataset Catalog</h1><p>A private searchable catalog for public sequencing datasets.</p>';
    container.replaceChildren(
      header,
      Dashboard(records),
      Filters({ records, state, onChange: (nextState) => renderCatalog(records, nextState) }),
      DatasetTable(filtered)
    );
  }

  async function unlock(password: string): Promise<void> {
    const response = await fetch('/datasets.enc.json');
    if (!response.ok) throw new Error('Encrypted dataset file was not found');
    const encrypted = (await response.json()) as EncryptedPayload;
    const plaintext = await decryptPayload(encrypted, password);
    const records = JSON.parse(plaintext) as DatasetRecord[];
    renderCatalog(records, { query: '', facets: {} });
  }

  container.append(UnlockView({ onUnlock: unlock }));
  return container;
}
```

- [ ] **Step 5: Add dashboard and table styles**

Append to `src/styles.css`:

```css
.page-header {
  margin-bottom: 24px;
}

.stat-grid, .chart-grid {
  display: grid;
  gap: 16px;
}

.stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-grid article, .chart-grid article, .table-wrap, .filters {
  background: white;
  border: 1px solid #d9e2ef;
  border-radius: 16px;
  padding: 18px;
}

.stat-grid span {
  display: block;
  color: #5f6f85;
}

.stat-grid strong {
  display: block;
  margin-top: 8px;
  font-size: 32px;
}

.chart-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.bar-row {
  display: grid;
  grid-template-columns: 150px 1fr 40px;
  gap: 10px;
  align-items: center;
  margin: 8px 0;
}

.bar-track {
  height: 10px;
  border-radius: 999px;
  background: #e8eef7;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #2563eb;
}

.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}

.filters label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}

.filters .search {
  grid-column: 1 / -1;
}

select[multiple] {
  min-height: 92px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 10px;
  border-bottom: 1px solid #edf1f7;
  vertical-align: top;
}

th {
  text-align: left;
  color: #44546a;
}

.tag {
  display: inline-block;
  margin: 2px;
  padding: 3px 7px;
  border-radius: 999px;
  background: #edf4ff;
  color: #1d4ed8;
  white-space: nowrap;
}

.notes {
  max-width: 260px;
}

@media (max-width: 900px) {
  .stat-grid, .chart-grid, .filters {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run checks**

Run:

```bash
npm run typecheck
npm test
```

Expected: PASS.

- [ ] **Step 7: Commit dashboard UI**

```bash
git add src/components/Dashboard.ts src/components/Filters.ts src/components/DatasetTable.ts src/components/App.ts src/styles.css
git commit -m "feat: render searchable dataset dashboard"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 11: Add dataset form

**Files:**
- Create: `src/components/AddDatasetForm.ts`
- Modify: `src/components/App.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Create AddDatasetForm component**

Create `src/components/AddDatasetForm.ts`:

```ts
import { buildIssueDraft } from '../lib/issue';
import type { RawDatasetRecord } from '../lib/types';

const fields: (keyof RawDatasetRecord)[] = [
  'id', 'title', 'summary', 'source_type', 'accessions', 'data_links', 'species', 'diseases', 'tissues',
  'sequencing_types', 'technology_tags', 'sample_count', 'download_status', 'notes', 'pmid', 'doi',
  'paper_title', 'journal', 'year', 'corresponding_author',
];

export function AddDatasetForm(owner: string, repo: string): HTMLElement {
  const details = document.createElement('details');
  details.className = 'add-form';
  details.innerHTML = `
    <summary>Add dataset</summary>
    <form>
      ${fields.map((field) => `<label>${field}<textarea name="${field}" rows="2"></textarea></label>`).join('')}
      <button type="submit">Generate GitHub Issue draft</button>
    </form>
    <p class="hint">If the generated URL is too long, copy the preview below into a new GitHub issue.</p>
    <textarea class="issue-preview" rows="12" readonly></textarea>
  `;

  const form = details.querySelector<HTMLFormElement>('form')!;
  const preview = details.querySelector<HTMLTextAreaElement>('.issue-preview')!;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const record = Object.fromEntries(fields.map((field) => [field, String(data.get(field) ?? '').trim()])) as unknown as RawDatasetRecord;
    const draft = buildIssueDraft(owner, repo, record);
    preview.value = draft.body;
    window.open(draft.url, '_blank', 'noopener,noreferrer');
  });

  return details;
}
```

- [ ] **Step 2: Add form to app**

Modify `src/components/App.ts` imports:

```ts
import { AddDatasetForm } from './AddDatasetForm';
```

In `renderCatalog`, update `container.replaceChildren(...)` to include the form before the table:

```ts
container.replaceChildren(
  header,
  Dashboard(records),
  Filters({ records, state, onChange: (nextState) => renderCatalog(records, nextState) }),
  AddDatasetForm('OWNER', 'REPO'),
  DatasetTable(filtered)
);
```

Replace `OWNER` and `REPO` with the target GitHub repository owner and repo name before deployment.

- [ ] **Step 3: Add form styles**

Append to `src/styles.css`:

```css
.add-form {
  margin: 20px 0;
  background: white;
  border: 1px solid #d9e2ef;
  border-radius: 16px;
  padding: 18px;
}

.add-form summary {
  cursor: pointer;
  font-weight: 800;
}

.add-form form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.add-form label {
  display: grid;
  gap: 6px;
  font-weight: 600;
}

.add-form button, .add-form .issue-preview, .add-form .hint {
  grid-column: 1 / -1;
}

.issue-preview {
  width: 100%;
}
```

- [ ] **Step 4: Run checks**

Run:

```bash
npm run typecheck
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit add form**

```bash
git add src/components/AddDatasetForm.ts src/components/App.ts src/styles.css
git commit -m "feat: add dataset issue draft form"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 12: CI and GitHub Pages build safety

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run typecheck
      - run: npm run build:data
      - run: npm run encrypt:data
        env:
          DATASET_CATALOG_PASSWORD: ${{ secrets.DATASET_CATALOG_PASSWORD }}
      - run: npm run build
        env:
          DATASET_CATALOG_PASSWORD: ${{ secrets.DATASET_CATALOG_PASSWORD }}
      - name: Verify plaintext data is not deployed
        run: |
          test ! -f dist/datasets.json
          test -f dist/datasets.enc.json
```

- [ ] **Step 2: Confirm ignored local artifacts**

Ensure `.gitignore` contains:

```gitignore
build/
public/datasets.enc.json
.env
```

- [ ] **Step 3: Run local full build**

Run:

```bash
DATASET_CATALOG_PASSWORD='change-me-locally' npm run build
```

Expected: tests pass, typecheck passes, `dist/` is generated, `dist/datasets.enc.json` exists, and `dist/datasets.json` does not exist.

- [ ] **Step 4: Commit CI**

```bash
git add .github/workflows/ci.yml .gitignore
git commit -m "ci: validate build and encrypted catalog artifact"
```

Expected: commit succeeds. If no git repository exists, skip commit and record that commits were unavailable.

---

### Task 13: Final verification

**Files:**
- No new files expected.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
DATASET_CATALOG_PASSWORD='change-me-locally' npm run build
```

Expected: build succeeds.

- [ ] **Step 2: Start local preview**

Run:

```bash
npm run dev
```

Expected: Vite starts a local development server. Use background execution if running through an agent tool.

- [ ] **Step 3: Manually verify unlock and catalog behavior**

Open the local URL and verify:

- The page initially shows only the password unlock screen.
- Entering a wrong password shows `密码错误或数据文件损坏`.
- Entering `change-me-locally` unlocks the catalog if the dev server serves the freshly encrypted file.
- The summary cards show 2 total datasets.
- The sequencing type chart includes `scRNA-seq` and `bulk RNA-seq`.
- Keyword search for `fibroblast` returns only `ds_0001`.
- Filtering species to `Mus musculus` returns only `ds_0002`.
- Add dataset form opens a GitHub Issue draft or fills the copyable fallback preview.

- [ ] **Step 4: Confirm no plaintext data artifact is deployed**

Run:

```bash
test ! -f dist/datasets.json && test -f dist/datasets.enc.json
```

Expected: command exits successfully.

- [ ] **Step 5: Commit any final fixes**

```bash
git status --short
git add .
git commit -m "chore: finalize sequencing dataset catalog"
```

Expected: commit succeeds only if there are final tracked changes. If no git repository exists or no changes exist, skip this commit.

---

## Self-review notes

- Spec coverage: The plan covers CSV source data, controlled vocabularies, validation, JSON build, encrypted published data, browser unlock, dashboard cards, sequencing type and disease charts, keyword search, facet filters, table display, Add Dataset issue draft, CI checks, and no plaintext deployed JSON.
- Scope: This is one coherent MVP. It intentionally excludes backend auth, sample-level records, analysis workflow tracking, and detail pages.
- Type consistency: Domain types use `RawDatasetRecord` for CSV and form data, `DatasetRecord` for normalized frontend records, and shared `EncryptedPayload` for Node and browser encryption/decryption.
- Known implementation adjustment: `AddDatasetForm('OWNER', 'REPO')` must be replaced with the actual GitHub owner and repository before deployment.
