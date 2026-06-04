import type { FilterState } from '../lib/search';
import type { DatasetRecord } from '../lib/types';
import { escapeAttribute, escapeHtml } from '../lib/html';

export interface FiltersOptions {
  records: DatasetRecord[];
  state: FilterState;
  onChange: (state: FilterState) => void;
}

function unique(records: DatasetRecord[], getter: (record: DatasetRecord) => string[]): string[] {
  return [...new Set(records.flatMap(getter))].sort((a, b) => a.localeCompare(b));
}

function select(name: string, label: string, values: string[], selected: string[]): string {
  const current = selected[0] ?? '';
  return `
    <label class="filter-field">
      <span>${escapeHtml(label)}</span>
      <select name="${escapeAttribute(name)}">
        <option value="">All ${escapeHtml(label)}</option>
        ${values.map((value) => `<option value="${escapeAttribute(value)}" ${current === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
      </select>
    </label>
  `;
}

export function Filters(options: FiltersOptions): HTMLElement {
  const form = document.createElement('form');
  form.className = 'filters';
  form.innerHTML = `
    <label class="search filter-field">
      <span>🔍 搜索数据集</span>
      <input name="query" value="${escapeAttribute(options.state.query)}" placeholder="搜索标题、作者、关键词..." />
    </label>
    <div class="filter-toolbar">
      <span class="toolbar-title">高级筛选</span>
      <button type="reset" class="ghost-button">重置筛选</button>
    </div>
    <div class="facet-grid">
      ${select('diseases', 'Disease', unique(options.records, (r) => r.diseases), options.state.facets.diseases ?? [])}
      ${select('species', 'Species', unique(options.records, (r) => r.species), options.state.facets.species ?? [])}
      ${select('tissues', 'Tissue', unique(options.records, (r) => r.tissues), options.state.facets.tissues ?? [])}
      ${select('sequencingTypes', 'Sequencing type', unique(options.records, (r) => r.sequencingTypes), options.state.facets.sequencingTypes ?? [])}
    </div>
  `;

  function readState(): FilterState {
    const data = new FormData(form);
    const readOne = (name: string): string[] => {
      const value = String(data.get(name) ?? '');
      return value ? [value] : [];
    };
    return {
      query: String(data.get('query') ?? ''),
      facets: {
        diseases: readOne('diseases'),
        species: readOne('species'),
        tissues: readOne('tissues'),
        sequencingTypes: readOne('sequencingTypes'),
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
