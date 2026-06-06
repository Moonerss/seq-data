import { buildIssueDraft } from '../lib/issue';
import type { RawDatasetRecord } from '../lib/types';
import { defaultVocabularies } from '../lib/validate';

interface AddField {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  control?: 'textarea' | 'select';
  options?: string[];
}

function vocabularyLabels(key: keyof typeof defaultVocabularies): string[] {
  return defaultVocabularies[key].map((entry) => entry.label);
}

const fields: AddField[] = [
  { name: 'accessions', label: 'Accessions', placeholder: 'GSE123456; SRP123456; TCGA-LUAD', required: true },
  { name: 'diseases', label: 'Disease', placeholder: 'lung adenocarcinoma / NSCLC / rare phenotype', required: true },
  { name: 'species', label: 'Species', control: 'select', options: vocabularyLabels('species'), required: true },
  { name: 'tissues', label: 'Tissue', placeholder: 'lung; tumor; metastatic lymph node', required: true },
  { name: 'sequencing_types', label: 'Sequencing', control: 'select', options: vocabularyLabels('sequencingTypes'), required: true },
  { name: 'sample_count', label: 'Samples', placeholder: '24' },
  { name: 'year', label: 'Year', placeholder: '2024' },
  { name: 'download_status', label: 'Status', control: 'select', options: vocabularyLabels('downloadStatuses') },
  { name: 'data_links', label: 'Links', placeholder: 'GEO=https://...; Paper=https://...', rows: 3, required: true },
  { name: 'source', label: 'Source', placeholder: 'Paper title / reference article', rows: 3 },
  { name: 'notes', label: 'Notes', placeholder: 'Biological context, sample selection, limitations...', rows: 3 },
];

function inferSourceType(accessions: string, links: string): string {
  const text = `${accessions} ${links}`.toLowerCase();
  if (text.includes('tcga')) return 'TCGA';
  if (/\bgse\d+/i.test(text) || text.includes('geo=')) return 'GEO';
  if (/\b(srp|srr|prjna)\d+/i.test(text) || text.includes('sra=')) return 'SRA';
  if (/\b(erp|err|prjeb)\d+/i.test(text) || text.includes('ena=')) return 'ENA';
  if (text.includes('zenodo')) return 'Zenodo';
  if (text.includes('figshare')) return 'Figshare';
  return 'Other';
}

function nextDraftId(): string {
  return `ds_${Date.now().toString().slice(-8)}`;
}

function formValue(data: FormData, name: string): string {
  return String(data.get(name) ?? '').trim();
}

function recordFromForm(data: FormData): RawDatasetRecord {
  const accessions = formValue(data, 'accessions');
  const dataLinks = formValue(data, 'data_links');
  const source = formValue(data, 'source');
  const diseases = formValue(data, 'diseases');
  const sequencing = formValue(data, 'sequencing_types');
  const title = [accessions, diseases, sequencing].filter(Boolean).join(' · ') || source || 'New dataset';

  return {
    id: nextDraftId(),
    title,
    summary: source,
    source_type: inferSourceType(accessions, dataLinks),
    accessions,
    data_links: dataLinks,
    species: formValue(data, 'species'),
    diseases,
    tissues: formValue(data, 'tissues'),
    sequencing_types: sequencing,
    technology_tags: '',
    sample_count: formValue(data, 'sample_count'),
    download_status: formValue(data, 'download_status') || 'unknown',
    notes: formValue(data, 'notes'),
    pmid: '',
    doi: '',
    paper_title: source,
    journal: '',
    year: formValue(data, 'year'),
    corresponding_author: '',
  };
}

function renderField(field: AddField): string {
  const required = field.required ? 'required' : '';
  const wideClass = field.rows && field.rows > 2 ? 'wide-field' : '';
  const label = `<span>${field.label}${field.required ? ' *' : ''}</span>`;

  if (field.control === 'select') {
    const options = field.options ?? [];
    const placeholder = field.required ? `Select ${field.label}` : 'unknown';
    return `
      <label class="${wideClass}">
        ${label}
        <select name="${field.name}" ${required}>
          <option value="">${placeholder}</option>
          ${options.map((option) => `<option value="${option}">${option}</option>`).join('')}
        </select>
      </label>
    `;
  }

  return `
    <label class="${wideClass}">
      ${label}
      <textarea name="${field.name}" rows="${field.rows ?? 2}" placeholder="${field.placeholder ?? ''}" ${required}></textarea>
    </label>
  `;
}

export function AddDatasetForm(owner: string, repo: string): HTMLElement {
  const details = document.createElement('details');
  details.className = 'add-form';
  details.innerHTML = `
    <summary>
      <span>Add dataset</span>
      <small>Fill the same fields shown in the table</small>
    </summary>
    <form>
      ${fields.map((field) => renderField(field)).join('')}
      <button type="submit">Generate GitHub Issue draft</button>
    </form>
    <p class="hint">Disease and tissue allow new free-text values; species, sequencing type, and status use controlled selections for consistent filtering.</p>
    <textarea class="issue-preview" rows="12" readonly></textarea>
  `;

  const form = details.querySelector<HTMLFormElement>('form')!;
  const preview = details.querySelector<HTMLTextAreaElement>('.issue-preview')!;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const record = recordFromForm(new FormData(form));
    const draft = buildIssueDraft(owner, repo, record);
    preview.value = draft.body;
    window.open(draft.url, '_blank', 'noopener,noreferrer');
  });

  return details;
}
