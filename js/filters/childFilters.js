// js/filters/childFilters.js
// Deliberately NOT a variant of sidebarFilters.js — the progress doc is explicit
// that dropdowns must be replaced with big icon buttons, not just restyled.
// Two filter groups only: Place and Category (per the spec's "only these 2
// filters needed").

import * as state from '../state.js';

const PLACE_ICONS = {
  East: '🌍',
  West: '🌅',
  North: '⛰️',
  South: '🏖️',
};

const CATEGORY_ICONS = {
  Electronics: '📱',
  Accessories: '🛍️',
  Wearables: '⌚',
};

export function createChildFilters(container, rawData) {
  const root = d3.select(container)
    .attr('class', 'flex flex-col gap-6 p-4 rounded-2xl')
    .style('background', 'var(--surface)')
    .style('border', '3px solid var(--accent-warm)');

  buildButtonGroup(root, 'Pick a Place 🗺️', ['All', ...new Set(rawData.map((d) => d.region))], PLACE_ICONS, (value) => {
    state.setFilter({ region: value });
  });

  buildButtonGroup(root, 'Pick a Category Type 🧸', ['All', ...new Set(rawData.map((d) => d.category))], CATEGORY_ICONS, (value) => {
    state.setFilter({ category: value });
  });

  function buildButtonGroup(parent, title, options, iconMap, onPick) {
    const group = parent.append('div');
    group.append('div')
      .attr('class', 'font-bold mb-3')
      .style('font-size', 'calc(1.1rem * var(--font-scale))')
      .style('color', 'var(--text-primary)')
      .text(title);

    const buttonRow = group.append('div')
      .attr('class', 'flex flex-wrap gap-3');

    const buttons = buttonRow.selectAll('button')
      .data(options)
      .join('button')
      .attr('class', 'child-filter-btn rounded-2xl font-bold shadow')
      .style('min-width', 'var(--tap-target-min)')
      .style('min-height', 'var(--tap-target-min)')
      .style('padding', '12px 20px')
      .style('font-size', 'calc(1.2rem * var(--font-scale))')
      .style('background', 'var(--accent)')
      .style('color', '#fff')
      .style('border', 'none')
      .style('cursor', 'pointer')
      .text((d) => `${iconMap[d] ?? '✨'} ${d === 'All' ? 'Everything' : d}`);

    buttons.on('click', function (event, d) {
      buttons.style('outline', 'none').style('transform', 'scale(1)');
      d3.select(this).style('outline', '4px solid var(--accent-warm)').style('transform', 'scale(1.05)');
      onPick(d);
    });
  }

  function destroy() {
    root.selectAll('*').remove();
  }

  return { destroy };
}
