// js/charts/childBarChart.js
import { revenueByMonth } from '../data/aggregate.js';
import { createTooltip } from '../utils/tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 55, left: 55 };

export function createChildBarChart(container, data) {
  const wrapper = d3.select(container);
  const chartBox = wrapper.append('div').style('position', 'relative');

  const width = 420;
  const height = 290;
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

  const xScale = d3.scaleBand().range([0, innerW]).padding(0.35);
  const yScale = d3.scaleLinear().range([innerH, 0]);
  const monthLabel = d3.timeFormat('%b');
  const parseMonth = d3.timeParse('%Y-%m');
  const tooltip = createTooltip(chartBox.node());

  // Playful color rotation — one color feels flat for a child-facing chart.
  const barColors = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#95e1d3', '#a8e6cf', '#ff8b94'];

  function render(newData) {
    // Single source of grouping truth — same function the Adult chart uses,
    // so a month can never appear twice or be summed twice across the app.
    const monthly = revenueByMonth(newData); // [ [ '2023-01', revenue ], ... ]

    xScale.domain(monthly.map((d) => d[0]));
    yScale.domain([0, (d3.max(monthly, (d) => d[1]) || 1) * 1.15]).nice();

    xAxisG.call(d3.axisBottom(xScale).tickFormat((m) => monthLabel(parseMonth(m))));
    yAxisG.call(d3.axisLeft(yScale).ticks(4).tickFormat((d) => `$${d3.format('.2s')(d)}`));

    xAxisG.selectAll('text')
      .attr('transform', 'rotate(-40)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.4em')
      .attr('dy', '0.3em');

    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text')
        .style('fill', 'var(--text-primary)')
        .style('font-size', 'calc(0.85rem * var(--font-scale))')
        .style('font-weight', '600');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    const bars = barsLayer.selectAll('rect').data(monthly, (d) => d[0]);
    bars.exit().remove();

    bars.enter()
      .append('rect')
      .attr('rx', 8)
      .attr('x', (d) => xScale(d[0]))
      .attr('width', xScale.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .merge(bars)
      .attr('fill', (d, i) => barColors[i % barColors.length])
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 0.8);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(
          `<strong>${d3.timeFormat('%B')(parseMonth(d[0]))}</strong><br/>💰 $${d3.format(',.0f')(d[1])}`,
          [x, y]
        );
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
        tooltip.hide();
      })
      .transition().duration(400)
      .attr('x', (d) => xScale(d[0]))
      .attr('width', xScale.bandwidth())
      .attr('y', (d) => yScale(d[1]))
      .attr('height', (d) => innerH - yScale(d[1]));
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
