// js/charts/childProgressBar.js
import { deliveryStatusBreakdown } from '../data/aggregate.js';

const STATUS_STYLE = {
  Delivered: { color: '#4ecdc4', icon: '✅' },
  'In Transit': { color: '#ffd93d', icon: '🚚' },
  Returned: { color: '#ff6b6b', icon: '↩️' },
  Unknown: { color: '#c9c9c9', icon: '❓' },
};

export function createChildProgressBar(container, data) {
  const wrapper = d3.select(container);
  const barTrack = wrapper.append('div')
    .attr('class', 'progress-track')
    .style('display', 'flex')
    .style('width', '100%')
    .style('height', '36px')
    .style('border-radius', '18px')
    .style('overflow', 'hidden')
    .style('border', '3px solid var(--grid-line)');

  const legend = wrapper.append('div')
    .attr('class', 'progress-legend flex flex-wrap gap-3 mt-3');

  function render(newData) {
    const breakdown = deliveryStatusBreakdown(newData); // [ [status, count], ... ]
    const total = d3.sum(breakdown, (d) => d[1]) || 1;

    const segments = barTrack.selectAll('.segment').data(breakdown, (d) => d[0]);
    segments.exit().remove();

    segments.enter()
      .append('div')
      .attr('class', 'segment')
      .style('height', '100%')
      .merge(segments)
      .style('width', (d) => `${(d[1] / total) * 100}%`)
      .style('background', (d) => STATUS_STYLE[d[0]]?.color ?? '#ccc')
      .style('transition', 'width 0.4s ease');

    const legendItems = legend.selectAll('.legend-item').data(breakdown, (d) => d[0]);
    legendItems.exit().remove();

    const entered = legendItems.enter()
      .append('div')
      .attr('class', 'legend-item flex items-center gap-2');

    entered.append('span').attr('class', 'legend-swatch')
      .style('width', '16px').style('height', '16px').style('border-radius', '50%');
    entered.append('span').attr('class', 'legend-text');

    const merged = entered.merge(legendItems);
    merged.select('.legend-swatch').style('background', (d) => STATUS_STYLE[d[0]]?.color ?? '#ccc');
    merged.select('.legend-text')
      .style('font-size', 'calc(1rem * var(--font-scale))')
      .style('color', 'var(--text-primary)')
      .text((d) => `${STATUS_STYLE[d[0]]?.icon ?? ''} ${d[0]}: ${d[1]} (${Math.round((d[1] / total) * 100)}%)`);
  }

  render(data);

  function update(newData) {
    render(newData);
  }

  function destroy() {
    wrapper.selectAll('*').remove();
  }

  return { update, destroy };
}
