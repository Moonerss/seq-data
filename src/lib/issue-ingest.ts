import { parseDatasetCsv } from './csv';

function extractCsvBlock(issueBody: string): string {
  const match = issueBody.match(/```csv\s*([\s\S]*?)```/i);
  if (!match?.[1]?.trim()) {
    throw new Error('Issue body does not contain a CSV dataset record block.');
  }
  return match[1].trim();
}

function ensureTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`;
}

export function appendDatasetRecordFromIssueBody(existingCsv: string, issueBody: string): string {
  const existingRows = parseDatasetCsv(existingCsv);
  const incomingCsv = extractCsvBlock(issueBody);
  const incomingRows = parseDatasetCsv(incomingCsv);

  if (incomingRows.length !== 1) {
    throw new Error(`Expected exactly one dataset record, found ${incomingRows.length}.`);
  }

  const incoming = incomingRows[0];
  if (!incoming.id) {
    throw new Error('Incoming dataset record is missing id.');
  }

  if (existingRows.some((row) => row.id === incoming.id)) {
    throw new Error(`Duplicate dataset id: ${incoming.id}`);
  }

  const incomingLines = incomingCsv.split(/\r?\n/);
  const recordLine = incomingLines[incomingLines.length - 1];
  return `${ensureTrailingNewline(existingCsv)}${recordLine}\n`;
}
