// js/charts/kpiCards.js
// This is the reference pattern for EVERY chart module in the app:
//   createXChart(container, data, config) -> { update(newData), destroy() }
// - container: a DOM node this chart owns completely
// - data: the already-filtered rows (never raw data)
// - config: profile-specific presentation only (labels, font size, colors) —
//   never data logic. Data logic always comes from aggregate.js.

import { summaryKpis } from '../data/aggregate.js';

const DEFAULT_LABELS = {
  revenue: 'Revenue',
  orders: 'Orders',
  aov: 'Avg Order Value',
  returnRate: 'Return Rate',
};

export function createKpiCards(container, data, config = {}) {
  const labels = { ...DEFAULT_LABELS, ...(config.labels || {}) };

  // Build the static card shells once.
  const cards = d3.select(container)
    .selectAll('.kpi-card')
    .data(['revenue', 'orders', 'aov', 'returnRate'])
    .join('div')
    .attr('class', 'kpi-card rounded-lg p-4')
    .style('background', 'var(--surface)')
    .style('border', '1px solid var(--grid-line)');

  cards.append('div')
    .attr('class', 'kpi-label')
    .style('color', 'var(--text-secondary)')
    .style('font-size', 'calc(0.8rem * var(--font-scale))')
    .text((key) => labels[key]);

  cards.append('div')
    .attr('class', 'kpi-value font-bold')
    .style('color', 'var(--text-primary)')
    .style('font-size', 'calc(1.6rem * var(--font-scale))');

  function format(key, kpis) {
    switch (key) {
      case 'revenue': return `$${d3.format(',.0f')(kpis.revenue)}`;
      case 'orders': return d3.format(',')(kpis.orders);
      case 'aov': return `$${kpis.aov.toFixed(2)}`;
      case 'returnRate': return `${(kpis.returnRate * 100).toFixed(1)}%`;
      default: return '';
    }
  }

  function update(newData) {
    const kpis = summaryKpis(newData);
    d3.select(container)
      .selectAll('.kpi-card')
      .select('.kpi-value')
      .text((key) => format(key, kpis));
  }

  function destroy() {
    d3.select(container).selectAll('*').remove();
  }

  update(data); // initial render
  return { update, destroy };
}
