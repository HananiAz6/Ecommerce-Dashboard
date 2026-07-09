// js/profiles/elderly.js
// Deliberately reuses the exact same chart factories as Adult mode. The only
// differences are: (1) largeTargets on the filters, (2) a single-column
// layout instead of a dense grid, (3) larger explicit width/height passed
// via config so charts render bigger, not just re-scaled by CSS. Font size
// and contrast come from the --font-scale / color tokens already set on
// body[data-profile="elderly"] in tokens.css — no chart code duplicated.

import { createSidebarFilters } from '../filters/sidebarFilters.js';
import { createKpiCards } from '../charts/kpiCards.js';
import { createRevenueTrendChart } from '../charts/revenueTrend.js';
import { createSalesByCategoryChart } from '../charts/salesByCategory.js';
import { createFulfillmentChart } from '../charts/fulfillment.js';
import { createCustomerSegmentsChart } from '../charts/customerSegments.js';
import { createRegionalHeatmap } from '../charts/regionalHeatmap.js';
import { createTimeline } from '../charts/timeline.js';
import { ELDERLY_LABELS } from './labels.js';

export function mount(els, rawData, filteredData) {
  const mounts = [];

  const filters = createSidebarFilters(els.sidebarEl, rawData, { largeTargets: true });
  mounts.push({ update: () => {}, destroy: filters.destroy });

  const kpis = createKpiCards(els.kpiEl, filteredData, { labels: ELDERLY_LABELS });
  mounts.push(kpis);

  // Single-column, larger charts — "highly simplified interactive layouts"
  // per the spec, not a shrunk copy of the dense Adult grid. Scatter Matrix
  // is deliberately excluded here: a 9-panel small-multiples chart is the
  // opposite of "simplified" for this audience, and Adult mode already
  // satisfies the 2-advanced-technique requirement with Heatmap + SPLOM.
  els.gridEl.className = 'mt-4 grid grid-cols-1 gap-6 max-w-3xl mx-auto';
  

  const largeConfig = { width: 640, height: 320 };
  const chartFactories = [
    (card, data) => createRevenueTrendChart(card, data, largeConfig),
    (card, data) => createFulfillmentChart(card, data, { width: 260, height: 240 }),
    (card, data) => createSalesByCategoryChart(card, data, largeConfig),
    (card, data) => createCustomerSegmentsChart(card, data, largeConfig),
    (card, data) => createRegionalHeatmap(card, data, largeConfig),
  ];

  chartFactories.forEach((factory) => {
    const card = document.createElement('div');
    els.gridEl.appendChild(card);
    mounts.push(factory(card, filteredData));
  });

  mounts.push(createTimeline(els.timelineEl, { largeMode: true, width: 900, height: 240 }));

  return mounts;
}
