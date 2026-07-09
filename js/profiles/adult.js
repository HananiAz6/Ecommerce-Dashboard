// js/profiles/adult.js
import { createSidebarFilters } from '../filters/sidebarFilters.js';
import { createKpiCards } from '../charts/kpiCards.js';
import { createRevenueTrendChart } from '../charts/revenueTrend.js';
import { createSalesByCategoryChart } from '../charts/salesByCategory.js';
import { createFulfillmentChart } from '../charts/fulfillment.js';
import { createCustomerSegmentsChart } from '../charts/customerSegments.js';
import { createRegionalHeatmap } from '../charts/regionalHeatmap.js';
import { createScatterMatrix } from '../charts/scatterMatrix.js';
import { createTimeline } from '../charts/timeline.js';
import { ADULT_LABELS } from './labels.js';

/**
 * @param {{kpiEl: HTMLElement, sidebarEl: HTMLElement, gridEl: HTMLElement}} els
 * @param {Array} rawData - full unfiltered dataset (needed to populate dropdown options)
 * @param {Array} filteredData - current filtered slice, for initial render
 * @returns {Array<{update, destroy}>} every mounted chart/filter instance
 */
export function mount(els, rawData, filteredData) {
  const mounts = [];

  const filters = createSidebarFilters(els.sidebarEl, rawData, { largeTargets: false });
  mounts.push({ update: () => {}, destroy: filters.destroy }); // filters don't redraw on data change

  const kpis = createKpiCards(els.kpiEl, filteredData, { labels: ADULT_LABELS });
  mounts.push(kpis);

  els.gridEl.className = 'mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';

  // All 6 required charts. Order here = visual order in the grid.
  const chartFactories = [
    createRevenueTrendChart,
    createFulfillmentChart,
    createSalesByCategoryChart,
    createCustomerSegmentsChart,
    createScatterMatrix,
    createRegionalHeatmap,
  ];

  chartFactories.forEach((factory) => {
    const card = document.createElement('div');
    els.gridEl.appendChild(card);
    mounts.push(factory(card, filteredData));
  });

  mounts.push(createTimeline(els.timelineEl, { largeMode: false }));

  return mounts;
}
