import { computeStats, type CountItem } from '../lib/stats';
import type { DatasetRecord } from '../lib/types';
import { escapeHtml } from '../lib/html';

const statMeta = [
  { label: 'Total datasets', className: 'is-total', icon: '∑' },
  { label: 'Diseases', className: 'is-disease', icon: '◌' },
  { label: 'Species', className: 'is-species', icon: '⌬' },
  { label: 'Downloaded', className: 'is-download', icon: '↓' },
];

const pieColors = ['#0f172a', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#64748b'];

function bar(label: string, count: number, max: number): string {
  const width = max === 0 ? 0 : Math.round((count / max) * 100);
  return `
    <div class="bar-row">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
      <strong>${count}</strong>
    </div>
  `;
}

function pieChart(items: CountItem[]): string {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return '<p class="empty-chart">No sequencing type data</p>';
  }

  let cursor = 0;
  const segments = items.map((item, index) => {
    const start = cursor;
    const size = (item.count / total) * 100;
    cursor += size;
    return `${pieColors[index % pieColors.length]} ${start.toFixed(3)}% ${cursor.toFixed(3)}%`;
  }).join(', ');

  return `
    <div class="pie-layout">
      <div class="pie-chart" style="background: conic-gradient(${segments});" role="img" aria-label="Sequencing type distribution pie chart">
        <div class="pie-center"><strong>${total}</strong><span>records</span></div>
      </div>
      <div class="pie-legend">
        ${items.map((item, index) => {
          const percentage = Math.round((item.count / total) * 100);
          return `
            <div class="pie-legend-row">
              <span class="legend-dot" style="background:${pieColors[index % pieColors.length]}"></span>
              <span class="legend-label">${escapeHtml(item.label)}</span>
              <strong>${item.count}</strong>
              <span class="legend-percent">${percentage}%</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function Dashboard(records: DatasetRecord[]): HTMLElement {
  const stats = computeStats(records);
  const values = [stats.totalDatasets, stats.diseaseCount, stats.speciesCount, stats.downloadedCount];
  const section = document.createElement('section');
  section.className = 'dashboard';
  const maxDisease = Math.max(0, ...stats.diseaseTop10.map((item) => item.count));
  section.innerHTML = `
    <div class="stat-grid">
      ${statMeta.map((meta, index) => `
        <article class="stat-card ${meta.className}">
          <div class="stat-orb">${meta.icon}</div>
          <span>${meta.label}</span>
          <strong>${values[index]}</strong>
        </article>
      `).join('')}
    </div>
    <div class="chart-grid">
      <article class="chart-card"><h2>Sequencing types</h2>${pieChart(stats.sequencingTypeDistribution)}</article>
      <article class="chart-card"><h2>Disease Top 10</h2>${stats.diseaseTop10.map((item) => bar(item.label, item.count, maxDisease)).join('')}</article>
    </div>
  `;
  return section;
}
