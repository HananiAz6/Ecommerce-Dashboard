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
  mounts.push({ update: () => {}, destroy: filters.destroy }); 

  const kpis = createKpiCards(els.kpiEl, filteredData, { labels: ADULT_LABELS });
  mounts.push(kpis);

  // Keep the flex-1 preservation configuration
  els.gridEl.className = 'flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4';

  // REARRANGED ORDER: Moved createScatterMatrix to the very bottom so it appends last
  const chartFactories = [
    { factory: createRevenueTrendChart, isScatter: false },
    { factory: createFulfillmentChart, isScatter: false },
    { factory: createSalesByCategoryChart, isScatter: false },
    { factory: createCustomerSegmentsChart, isScatter: false },
    { factory: createRegionalHeatmap, isScatter: false },     // Heatmap renders first
    { factory: createScatterMatrix, isScatter: true },        // Scatter plot renders last (below)
  ];

  chartFactories.forEach(({ factory, isScatter }) => {
    const card = document.createElement('div');
    
    if (isScatter) {
      card.className = 'col-span-1 md:col-span-2 xl:col-span-3 w-full clear-both';
      card.style.gridColumn = '1 / -1'; 
      els.gridEl.appendChild(card);
      mounts.push(factory(card, filteredData, { width: 850, height: 380 }));
    } else {
      card.className = 'w-full';
      els.gridEl.appendChild(card);
      mounts.push(factory(card, filteredData));
    }
  });

  mounts.push(createTimeline(els.timelineEl, { largeMode: false }));

  return mounts;
}
