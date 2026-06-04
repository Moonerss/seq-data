import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseDatasetCsv } from '../src/lib/csv';
import { buildDatasets } from '../src/lib/builddataset';
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
