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
