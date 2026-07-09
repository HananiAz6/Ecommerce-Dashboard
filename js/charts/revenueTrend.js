// js/charts/revenueTrend.js
import { revenueByMonth, forecastNextMonths } from '../data/aggregate.js';
import { createTooltip } from '../utils/tooltip.js';

const MARGIN = { top: 20, right: 30, bottom: 30, left: 60 };

export function createRevenueTrendChart(container, data, config = {}) {
  const title = config.title ?? 'Gross Sales Revenue Trend (with Forecast)';

  const wrapper = d3.select(container)
    .attr('class', 'chart-card rounded-lg p-4 relative')
    .style('background', 'var(--surface)')
    .style('border', '1px solid var(--grid-line)');

  wrapper.append('div')
    .attr('class', 'chart-title font-semibold mb-2')
    .style('color', 'var(--text-primary)')
    .style('font-size', 'calc(1rem * var(--font-scale))')
    .text(title);

  const chartBox = wrapper.append('div').style('position', 'relative');
  const parseMonth = d3.timeParse('%Y-%m');
  const width = config.width ?? 520;
  const height = config.height ?? 280;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const svg = chartBox.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  // Clip path so zoomed/panned content never draws outside the plot area.
  svg.append('defs').append('clipPath')
    .attr('id', 'revenue-trend-clip')
    .append('rect')
    .attr('width', innerW)
    .attr('height', innerH);

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
  const plotArea = g.append('g').attr('clip-path', 'url(#revenue-trend-clip)');

  const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
  const yAxisG = g.append('g');

  const xScale = d3.scaleTime().range([0, innerW]);
  const yScale = d3.scaleLinear().range([innerH, 0]);

  const actualLine = d3.line().x((d) => xScale(d.date)).y((d) => yScale(d.revenue));
  const forecastLine = d3.line().x((d) => xScale(d.date)).y((d) => yScale(d.revenue));

  const actualPath = plotArea.append('path')
    .attr('fill', 'none')
    .attr('stroke', 'var(--accent)')
    .attr('stroke-width', 2.5);

  const forecastPath = plotArea.append('path')
    .attr('fill', 'none')
    .attr('stroke', 'var(--accent-warm)')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,4');

  const dotsLayer = plotArea.append('g');
  const tooltip = createTooltip(chartBox.node());

  let currentXScale = xScale; // tracks zoom transform for redraws

  function render(newData) {
    const monthly = revenueByMonth(newData);
    if (monthly.length === 0) {
      actualPath.attr('d', null);
      forecastPath.attr('d', null);
      dotsLayer.selectAll('*').remove();
      return;
    }

    const actualPoints = monthly.map(([m, revenue]) => ({ date: parseMonth(m), revenue, type: 'actual' }));
    const forecastRaw = forecastNextMonths(monthly, 2);
    // forecast line should visually connect from the last actual point
    const forecastPoints = [
      actualPoints[actualPoints.length - 1],
      ...forecastRaw.map(([m, revenue]) => ({ date: parseMonth(m), revenue, type: 'forecast' })),
    ];

    const allDates = [...actualPoints, ...forecastPoints].map((d) => d.date);
    const allRevenues = [...actualPoints, ...forecastPoints].map((d) => d.revenue);

    xScale.domain(d3.extent(allDates));
    yScale.domain([0, d3.max(allRevenues) * 1.1]).nice();
    currentXScale = xScale;

    xAxisG.call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %Y')));
    yAxisG.call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `$${d3.format('.2s')(d)}`));
    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text').style('fill', 'var(--text-secondary)').style('font-size', 'calc(0.7rem * var(--font-scale))');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    actualPath.datum(actualPoints).attr('d', actualLine);
    forecastPath.datum(forecastPoints).attr('d', forecastLine);

    // Dots only on actual points — highlighting + tooltip target (Task 4).
    const dots = dotsLayer.selectAll('circle').data(actualPoints, (d) => +d.date);
    dots.exit().remove();
    dots.enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', 'var(--accent)')
      .merge(dots)
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.revenue))
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 7);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(
          `<strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br/>Revenue: $${d3.format(',.0f')(d.revenue)}`,
          [x, y]
        );
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 4);
        tooltip.hide();
      });
  }

  // --- Zoom / Pan (Task 4 requirement) ---
  const zoom = d3.zoom()
    .scaleExtent([1, 6])
    .translateExtent([[0, 0], [innerW, innerH]])
    .extent([[0, 0], [innerW, innerH]])
    .on('zoom', (event) => {
      currentXScale = event.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(currentXScale).ticks(6).tickFormat(d3.timeFormat('%b %Y')));
      xAxisG.selectAll('text').style('fill', 'var(--text-secondary)').style('font-size', 'calc(0.7rem * var(--font-scale))');
      xAxisG.selectAll('path,line').style('stroke', 'var(--grid-line)');

      const zoomedActualLine = d3.line().x((d) => currentXScale(d.date)).y((d) => yScale(d.revenue));
      actualPath.attr('d', zoomedActualLine);
      forecastPath.attr('d', d3.line().x((d) => currentXScale(d.date)).y((d) => yScale(d.revenue)));
      dotsLayer.selectAll('circle').attr('cx', (d) => currentXScale(d.date));
    });

  svg.call(zoom);

  render(data);

  function update(newData) {
    render(newData);
  }

  function destroy() {
    tooltip.destroy();
    svg.on('.zoom', null);
    wrapper.selectAll('*').remove();
  }

  return { update, destroy };
}
