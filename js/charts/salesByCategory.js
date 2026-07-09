// js/charts/salesByCategory.js
import { revenueByCategory } from '../data/aggregate.js';
import { createTooltip } from '../utils/tooltip.js';


const MARGIN = { top: 20, right: 50, bottom: 40, left: 140 };

export function createSalesByCategoryChart(container, data, config = {}) {
  const title = config.title ?? 'Sales by Category';

  const wrapper = d3.select(container)
    .attr('class', 'chart-card rounded-lg p-4')
    .style('background', 'var(--surface)')
    .style('border', '1px solid var(--grid-line)');

  wrapper.append('div')
    .attr('class', 'chart-title font-semibold mb-2')
    .style('color', 'var(--text-primary)')
    .style('font-size', 'calc(1rem * var(--font-scale))')
    .text(title);

  const chartBox = wrapper.append('div').style('position', 'relative');

  const width = config.width ?? 420;
  const height = config.height ?? 220;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const svg = chartBox.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
  const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
  const yAxisG = g.append('g');
  const barsLayer = g.append('g');
  const tooltip = createTooltip(chartBox.node());

  const yScale = d3.scaleBand().range([0, innerH]).padding(0.3);
  const xScale = d3.scaleLinear().range([0, innerW]);

  const categoryColors = { Electronics: '#38bdf8', Accessories: '#a78bfa', Wearables: '#34d399' };

  function render(newData) {
    const byCategory = revenueByCategory(newData); // [ [category, revenue], ... ] sorted desc

    yScale.domain(byCategory.map((d) => d[0]));
    xScale.domain([0, (d3.max(byCategory, (d) => d[1]) || 1) * 1.1]).nice();

    xAxisG.call(d3.axisBottom(xScale).ticks(4).tickFormat((d) => `$${d3.format('.2s')(d)}`));
    yAxisG.call(d3.axisLeft(yScale));
    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text')
        .style('fill', 'var(--text-secondary)')
        .style('font-size', 'calc(0.8rem * var(--font-scale))');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    const bars = barsLayer.selectAll('rect').data(byCategory, (d) => d[0]);
    bars.exit().remove();

    bars.enter()
      .append('rect')
      .attr('y', (d) => yScale(d[0]))
      .attr('height', yScale.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('rx', 4)
      .merge(bars)
      .attr('fill', (d) => categoryColors[d[0]] ?? 'var(--accent)')
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 0.75);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(`<strong>${d[0]}</strong><br/>Revenue: $${d3.format(',.0f')(d[1])}`, [x, y]);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
        tooltip.hide();
      })
      .transition().duration(400)
      .attr('y', (d) => yScale(d[0]))
      .attr('height', yScale.bandwidth())
      .attr('width', (d) => xScale(d[1]));
  }

  render(data);

  function update(newData) {
    render(newData);
  }

  function destroy() {
    tooltip.destroy();
    wrapper.selectAll('*').remove();
  }

  return { update, destroy };
}
