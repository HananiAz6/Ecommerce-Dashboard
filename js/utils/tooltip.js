// js/utils/tooltip.js
// One tooltip div per chart instance (not a global singleton) so multiple
// charts can show tooltips independently and destroy() cleanly removes only
// their own tooltip node.

export function createTooltip(container) {
  const el = d3.select(container)
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('background', 'var(--bg)')
    .style('color', 'var(--text-primary)')
    .style('border', '1px solid var(--accent)')
    .style('border-radius', '6px')
    .style('padding', '8px 12px')
    .style('font-size', 'calc(0.8rem * var(--font-scale))')
    .style('z-index', 10)
    .style('white-space', 'nowrap');

  function show(html, [x, y]) {
    el.style('opacity', 1)
      .html(html)
      .style('left', `${x + 12}px`)
      .style('top', `${y - 12}px`);
  }

  function hide() {
    el.style('opacity', 0);
  }

  function destroy() {
    el.remove();
  }

  return { show, hide, destroy };
}
