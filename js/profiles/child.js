// js/profiles/child.js
import { createChildFilters } from '../filters/childFilters.js';
import { createKpiCards } from '../charts/kpiCards.js';
import { createChildBarChart } from '../charts/childBarChart.js';
import { createChildProgressBar } from '../charts/childProgressBar.js';
import { CHILD_LABELS } from './labels.js';

export function mount(els, rawData, filteredData) {
  const mounts = [];

  const filters = createChildFilters(els.sidebarEl, rawData);
  mounts.push({ update: () => {}, destroy: filters.destroy });

  // Child mode still shows KPI numbers, just relabeled and simplified — spec
  // only requires removing the ADVANCED charts, not the summary numbers.
  const kpis = createKpiCards(els.kpiEl, filteredData, { labels: CHILD_LABELS });
  mounts.push(kpis);

  // Exactly 2 cards, nothing else — advanced matrices never touch this DOM.
  els.gridEl.className = 'mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl';

  const barCard = document.createElement('div');
  barCard.className = 'p-6 rounded-2xl';
  barCard.style.background = 'var(--surface)';
  barCard.style.border = '3px solid var(--accent)';
  const barTitle = document.createElement('div');
  barTitle.style.fontSize = 'calc(1.2rem * var(--font-scale))';
  barTitle.style.fontWeight = 'bold';
  barTitle.style.marginBottom = '8px';
  barTitle.textContent = '📊 Money Earned by Month';
  barCard.appendChild(barTitle);
  const barChartMount = document.createElement('div');
  barCard.appendChild(barChartMount);

  const progressCard = document.createElement('div');
  progressCard.className = 'p-6 rounded-2xl';
  progressCard.style.background = 'var(--surface)';
  progressCard.style.border = '3px solid var(--accent-warm)';
  const progressTitle = document.createElement('div');
  progressTitle.style.fontSize = 'calc(1.2rem * var(--font-scale))';
  progressTitle.style.fontWeight = 'bold';
  progressTitle.style.marginBottom = '12px';
  progressTitle.textContent = '📦 Delivery Progress';
  progressCard.appendChild(progressTitle);
  const progressMount = document.createElement('div');
  progressCard.appendChild(progressMount);

  els.gridEl.append(barCard, progressCard);

  mounts.push(createChildBarChart(barChartMount, filteredData));
  mounts.push(createChildProgressBar(progressMount, filteredData));

  return mounts;
}
