import type { DatasetRecord } from '../lib/types';
import { escapeHtml, safeHttpUrl } from '../lib/html';

function tags(values: string[]): string {
  return values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join(' ');
}

function links(record: DatasetRecord): string {
  return record.dataLinks.map((link) => {
    const safeUrl = safeHttpUrl(link.url);
    if (!safeUrl) return `<span class="invalid-link">${escapeHtml(link.label)}</span>`;
    return `<a class="data-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`;
  }).join(' ');
}

function statusClass(status: string | undefined): string {
  if (!status) return 'status-pill is-unknown';
  return `status-pill is-${status.replaceAll(' ', '-')}`;
}

function publicationSource(record: DatasetRecord): string {
  const publication = record.publication;
  const title = publication.title || record.title;
  const meta = [publication.journal, publication.year?.toString()].filter(Boolean).join(' · ');
  const identifiers = [publication.pmid ? `PMID: ${publication.pmid}` : '', publication.doi ? `DOI: ${publication.doi}` : ''].filter(Boolean).join(' · ');
  return `
    <div class="source-cell">
      <strong>${escapeHtml(title)}</strong>
      ${meta ? `<small>${escapeHtml(meta)}</small>` : ''}
      ${identifiers ? `<small>${escapeHtml(identifiers)}</small>` : ''}
    </div>
  `;
}

export function DatasetTable(records: DatasetRecord[]): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'table-wrap';
  let pageSize = 10;
  let currentPage = 1;

  function render(): void {
    const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageRecords = records.slice(start, start + pageSize);
    const from = records.length === 0 ? 0 : start + 1;
    const to = Math.min(start + pageSize, records.length);

    wrapper.innerHTML = `
      <div class="table-titlebar">
        <div>
          <p class="eyebrow">Catalog table</p>
          <h2>${records.length} matching datasets</h2>
        </div>
        <div class="table-controls">
          <label>
            Rows per page
            <select class="page-size-select" aria-label="Rows per page">
              ${[10, 20, 50, 100].map((size) => `<option value="${size}" ${pageSize === size ? 'selected' : ''}>${size}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>
      <div class="table-scroller">
        <table>
          <thead>
            <tr>
              <th>Accessions</th><th>Disease</th><th>Species</th><th>Tissue</th><th>Sequencing</th>
              <th>Samples</th><th>Year</th><th>Status</th><th>Links</th><th>Source</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${pageRecords.map((record) => `
              <tr>
                <td>${tags(record.accessions)}</td>
                <td>${tags(record.diseases)}</td>
                <td>${tags(record.species)}</td>
                <td>${tags(record.tissues)}</td>
                <td>${tags(record.sequencingTypes)}</td>
                <td class="numeric-cell">${record.sampleCount ?? ''}</td>
                <td class="numeric-cell">${record.publication.year ?? ''}</td>
                <td><span class="${escapeHtml(statusClass(record.downloadStatus))}">${escapeHtml(record.downloadStatus ?? 'unknown')}</span></td>
                <td class="link-cell">${links(record)}</td>
                <td>${publicationSource(record)}</td>
                <td class="notes">${escapeHtml(record.notes ?? '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination-bar">
        <span>Showing ${from}-${to} of ${records.length}</span>
        <div class="pagination-actions">
          <button class="pagination-button" type="button" data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
          <span>Page ${currentPage} / ${totalPages}</span>
          <button class="pagination-button" type="button" data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;

    wrapper.querySelector<HTMLSelectElement>('.page-size-select')?.addEventListener('change', (event) => {
      pageSize = Number((event.currentTarget as HTMLSelectElement).value);
      currentPage = 1;
      render();
    });

    wrapper.querySelectorAll<HTMLButtonElement>('.pagination-button').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'prev') currentPage = Math.max(1, currentPage - 1);
        if (action === 'next') currentPage = Math.min(totalPages, currentPage + 1);
        render();
      });
    });
  }

  render();
  return wrapper;
}
