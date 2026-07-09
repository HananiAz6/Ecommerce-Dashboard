// js/charts/scatterMatrix.js
// A true small-multiples scatter plot matrix (Task 5's "Scatter Plot Matrix"
// technique) across three continuous variables. Operates on row-level data,
// unlike every other chart in this file which works on aggregated data —
// that's intentional: SPLOM's whole value is showing raw-point relationships
// and clusters that aggregation would hide.

import { createTooltip } from '../utils/tooltip.js';

const VARS = [
  { key: 'unitPrice', label: 'Unit Price' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'revenue', label: 'Revenue' },
];
const CATEGORY_COLORS = { Electronics: '#38bdf8', Accessories: '#a78bfa', Wearables: '#34d399' };

export function createScatterMatrix(container, data, config = {}) {
  const title = config.title ?? 'Scatter Plot Matrix';

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

  const cellSize = config.cellSize ?? 110;
  const pad = 24; // room for outer axis labels
  const n = VARS.length;
  const width = pad + cellSize * n;
  const height = pad + cellSize * n;

  const svg = chartBox.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const root = svg.append('g').attr('transform', `translate(${pad},0)`);
  const tooltip = createTooltip(chartBox.node());
  const cellsHolder = root.append('g');

  function render(newData) {
    cellsHolder.selectAll('*').remove();
    if (newData.length === 0) return;

    // Sample for performance/legibility if the filtered set is still large —
    // 1000 raw points across 9 cells is fine, but this keeps it safe if the
    // dataset grows.
    const points = newData.length > 1500 ? d3.shuffle(newData.slice()).slice(0, 1500) : newData;

    const scales = {};
    VARS.forEach((v) => {
      scales[v.key] = d3.scaleLinear()
        .domain(d3.extent(points, (d) => d[v.key])).nice()
        .range([8, cellSize - 8]);
    });

    VARS.forEach((rowVar, row) => {
      VARS.forEach((colVar, col) => {
        const cellG = cellsHolder.append('g')
          .attr('transform', `translate(${col * cellSize},${row * cellSize})`);

        cellG.append('rect')
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', 'none')
          .attr('stroke', 'var(--grid-line)');

        if (row === col) {
          // Diagonal: variable label instead of a meaningless self-scatter.
          cellG.append('text')
            .attr('x', cellSize / 2)
            .attr('y', cellSize / 2)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', 'calc(0.75rem * var(--font-scale))')
            .style('font-weight', '600')
            .text(rowVar.label);
          return;
        }

        const xScale = scales[colVar.key];
        const yScale = scales[rowVar.key];

        cellG.selectAll('circle')
          .data(points)
          .join('circle')
          .attr('cx', (d) => xScale(d[colVar.key]))
          .attr('cy', (d) => cellSize - yScale(d[rowVar.key]))
          .attr('r', 2.5)
          .attr('fill', (d) => CATEGORY_COLORS[d.category] ?? '#999')
          .attr('opacity', 0.55)
          .on('mouseover', function (event, d) {
            d3.select(this).attr('r', 5).attr('opacity', 1);
            const [x, y] = d3.pointer(event, chartBox.node());
            tooltip.show(
              `<strong>${d.product}</strong> (${d.category})<br/>` +
              `${colVar.label}: ${d3.format(',.2f')(d[colVar.key])}<br/>` +
              `${rowVar.label}: ${d3.format(',.2f')(d[rowVar.key])}`,
              [x, y]
            );
          })
          .on('mouseout', function () {
            d3.select(this).attr('r', 2.5).attr('opacity', 0.55);
            tooltip.hide();
          });
      });
    });
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
