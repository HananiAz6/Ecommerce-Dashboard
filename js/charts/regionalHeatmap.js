// js/charts/regionalHeatmap.js
import { revenueByRegionCategory } from '../data/aggregate.js';
import { createTooltip } from '../utils/tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 40, left: 100 };

export function createRegionalHeatmap(container, data, config = {}) {
  const title = config.title ?? 'Regional Performance Matrix';

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
  const cellsLayer = g.append('g');
  const tooltip = createTooltip(chartBox.node());

  const xScale = d3.scaleBand().range([0, innerW]).padding(0.05);
  const yScale = d3.scaleBand().range([0, innerH]).padding(0.05);

  function render(newData) {
    const cells = revenueByRegionCategory(newData); // [ {region, category, revenue}, ... ]
    const regions = [...new Set(cells.map((d) => d.region))].sort();
    const categories = [...new Set(cells.map((d) => d.category))].sort();

    xScale.domain(categories);
    yScale.domain(regions);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(cells, (d) => d.revenue) || 1]);

    xAxisG.call(d3.axisBottom(xScale));
    yAxisG.call(d3.axisLeft(yScale));
    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text')
        .style('fill', 'var(--text-secondary)')
        .style('font-size', 'calc(0.75rem * var(--font-scale))');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    const rects = cellsLayer.selectAll('rect').data(cells, (d) => `${d.region}-${d.category}`);
    rects.exit().remove();

    rects.enter()
      .append('rect')
      .attr('x', (d) => xScale(d.category))
      .attr('y', (d) => yScale(d.region))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('opacity', 0)
      .merge(rects)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', 'var(--accent-warm)').attr('stroke-width', 2);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(
          `<strong>${d.region} × ${d.category}</strong><br/>Revenue: $${d3.format(',.0f')(d.revenue)}`,
          [x, y]
        );
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'none');
        tooltip.hide();
      })
      .transition().duration(400)
      .attr('x', (d) => xScale(d.category))
      .attr('y', (d) => yScale(d.region))
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('opacity', 1)
      .attr('fill', (d) => colorScale(d.revenue));
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
