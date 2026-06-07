import { decryptPayload, type EncryptedPayload } from '../lib/crypto';
import { escapeHtml } from '../lib/html';
import { filterDatasets, orderDatasetsForDisplay, type FilterState } from '../lib/search';
import type { DatasetRecord } from '../lib/types';
import { AddDatasetForm } from './adddatasetform';
import { Dashboard } from './dashboard';
import { DatasetTable } from './datasettable';
import { Filters } from './filters';
import { UnlockView } from './unlockview';

function diseaseCounts(records: DatasetRecord[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const disease of record.diseases) {
      counts.set(disease, (counts.get(disease) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function App(): HTMLElement {
  const container = document.createElement('main');
  container.className = 'shell';

  function renderCatalog(records: DatasetRecord[], state: FilterState): void {
    const filtered = filterDatasets(records, state);
    const selectedDiseases = state.facets.diseases ?? [];
    const diseaseItems = diseaseCounts(records);

    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <h1>🧬 Sequencing Dataset Catalog</h1>
      <div class="header-actions">
        <button class="btn btn-outline" type="button">📥 Import / Export</button>
        <button class="btn btn-text" type="button">🚪 Locked data</button>
      </div>
    `;

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header"><h2>疾病分类</h2></div>
      <ul class="type-list">
        <li><button class="type-item ${selectedDiseases.length === 0 ? 'active' : ''}" data-disease=""><span>全部</span><span class="count">${records.length}</span></button></li>
        ${diseaseItems.map((item) => `
          <li><button class="type-item ${selectedDiseases.includes(item.label) ? 'active' : ''}" data-disease="${escapeHtml(item.label)}"><span>${escapeHtml(item.label)}</span><span class="count">${item.count}</span></button></li>
        `).join('')}
      </ul>
      <div class="add-type"><input placeholder="新增分类..." aria-label="新增分类" /><button type="button">+</button></div>
    `;

    const content = document.createElement('section');
    content.className = 'content';
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.replaceChildren(
      Dashboard(records),
      AddDatasetForm('Moonerss', 'seq-data'),
      Filters({ records, state, onChange: (nextState) => renderCatalog(records, nextState) }),
      DatasetTable(filtered),
    );
    content.replaceChildren(sidebar, mainContent);
    container.replaceChildren(header, content);

    sidebar.querySelectorAll<HTMLButtonElement>('.type-item').forEach((button) => {
      button.addEventListener('click', () => {
        const disease = button.dataset.disease ?? '';
        renderCatalog(records, {
          ...state,
          facets: {
            ...state.facets,
            diseases: disease ? [disease] : [],
          },
        });
      });
    });
  }

  async function unlock(password: string): Promise<void> {
    const response = await fetch(`${import.meta.env.BASE_URL}datasets.enc.json`);
    const encrypted = (await response.json()) as EncryptedPayload;
    const plaintext = await decryptPayload(encrypted, password);
    const records = orderDatasetsForDisplay(JSON.parse(plaintext) as DatasetRecord[]);
    renderCatalog(records, { query: '', facets: {} });
  }

  container.append(UnlockView({ onUnlock: unlock }));
  return container;
}
