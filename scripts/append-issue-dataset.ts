import { readFileSync, writeFileSync } from 'node:fs';
import { appendDatasetRecordFromIssueBody } from '../src/lib/issue-ingest';

const csvPath = process.env.DATASETS_CSV_PATH ?? 'data/datasets.csv';
const issueBodyPath = process.env.ISSUE_BODY_PATH;

if (!issueBodyPath) {
  console.error('ISSUE_BODY_PATH is required.');
  process.exit(1);
}

const existingCsv = readFileSync(csvPath, 'utf8');
const issueBody = readFileSync(issueBodyPath, 'utf8');
const updatedCsv = appendDatasetRecordFromIssueBody(existingCsv, issueBody);
writeFileSync(csvPath, updatedCsv);
console.log(`Appended dataset record to ${csvPath}`);
