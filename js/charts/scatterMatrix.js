// js/charts/scatterMatrix.js
import { createTooltip } from '../utils/tooltip.js';

const MARGIN = { top: 20, right: 30, bottom: 50, left: 85 };

// High-Contrast Dark-Mode Friendly Colors: Cyan, Magenta/Purple, and Mint Green
const DARK_MODE_COLORS = { 
  Electronics: '#00f0ff',   // Electric Cyan
  Accessories: '#d946ef',   // Bright Purple
  Wearables: '#10b981'     // Neon Green
};

export function createScatterMatrix(container, data, config = {}) {
  const title = config.title ?? 'Customer Age vs. Total Purchase Spend';

  const wrapper = d3.select(container)
    .attr('class', 'chart-card rounded-lg p-4')
    .style('background', 'var(--surface)')
    .style('border', '1px solid var(--grid-line)');

  // Header row for Title and HTML Legend
  const headerRow = wrapper.append('div')
    .attr('class', 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4');
  
  headerRow.append('div')
    .attr('class', 'chart-title font-semibold')
    .style('color', 'var(--text-primary)')
    .style('font-size', 'calc(1rem * var(--font-scale))')
    .text(title);

  // --- HTML LEGEND BOX ---
  const legendContainer = headerRow.append('div')
    .attr('class', 'flex gap-3 text-xs font-medium');

  Object.entries(DARK_MODE_COLORS).forEach(([category, color]) => {
    const item = legendContainer.append('div').attr('class', 'flex items-center gap-1.5');
    item.append('span')
      .style('display', 'inline-block')
      .style('width', '10px')
      .style('height', '10px')
      .style('border-radius', '50%')
      .style('background-color', color);
    item.append('span')
      .style('color', 'var(--text-secondary)')
      .text(category);
  });

  const chartBox = wrapper.append('div').style('position', 'relative');

  // Wide layout proportions to give the points space to breathe
  const width = config.width ?? 500;
  const height = config.height ?? 340;
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;

  const svg = chartBox.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
  const gridLayer = g.append('g').attr('class', 'grid-lines');
  const xAxisG = g.append('g').attr('transform', `translate(0,${innerH})`);
  const yAxisG = g.append('g');
  const dotsLayer = g.append('g');
  
  const tooltip = createTooltip(chartBox.node());

  const xScale = d3.scaleLinear().range([0, innerW]);
  const yScale = d3.scaleLinear().range([innerH, 0]);
  const rScale = d3.scaleLinear().range([3, 9]); // Controls sizes cleanly based on shipping fees

  function render(newData) {
    // Filter out rows missing vital Age indices safely
    const points = newData.filter(d => d.age !== undefined && d.age !== null);
    
    if (points.length === 0) {
      dotsLayer.selectAll('circle').remove();
      return;
    }

    // Dynamic Domain Scales
    xScale.domain([d3.min(points, d => d.age) - 2, d3.max(points, d => d.age) + 2]).nice();
    yScale.domain([0, d3.max(points, d => d.revenue || d.totalPrice || 0) + 100]).nice();
    rScale.domain([d3.min(points, d => d.shippingFee || 0), d3.max(points, d => d.shippingFee || 20)]).nice();

    // Clean Background Grid Layout Lines
    gridLayer.selectAll('*').remove();
    gridLayer.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSize(-innerH).tickFormat(''))
      .selectAll('line')
      .style('stroke', 'var(--grid-line)')
      .style('stroke-dasharray', '3,3');

    gridLayer.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW).tickFormat(''))
      .selectAll('line')
      .style('stroke', 'var(--grid-line)')
      .style('stroke-dasharray', '3,3');

    // Call Interactive Axes
    xAxisG.call(d3.axisBottom(xScale).ticks(6));
    yAxisG.call(d3.axisLeft(yScale).ticks(6).tickFormat(d3.format('$,.0f')));

    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text').style('fill', 'var(--text-secondary)').style('font-size', '11px');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    // Outer Axis Labels
    svg.selectAll('.axis-label').remove();
    svg.append('text')
      .attr('class', 'axis-label')
      .attr('x', MARGIN.left + innerW / 2)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .style('font-size', '11px')
      .text('Customer Age');

    svg.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(MARGIN.top + innerH / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .style('font-size', '11px')
      .text('Total Price ($)');

    // Data Binding for Circles
    const circles = dotsLayer.selectAll('circle').data(points, (d, i) => d.id || i);
    circles.exit().remove();

    circles.enter()
      .append('circle')
      .attr('cx', d => xScale(d.age))
      .attr('cy', d => yScale(d.revenue || d.totalPrice || 0))
      .attr('r', 0)
      .merge(circles)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke', '#ffffff').attr('stroke-width', 2).attr('opacity', 1);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(
          `<strong>Category: ${d.category}</strong><br/>` +
          `Age: ${d.age}<br/>` +
          `Total Price: $${(d.revenue || d.totalPrice || 0).toFixed(2)}<br/>` +
          `Shipping Fee: $${(d.shippingFee || 0).toFixed(2)}`,
          [x, y]
        );
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'none').attr('opacity', 0.70);
        tooltip.hide();
      })
      .transition().duration(400)
      .attr('cx', d => xScale(d.age))
      .attr('cy', d => yScale(d.revenue || d.totalPrice || 0))
      .attr('r', d => rScale(d.shippingFee || 5))
      .attr('fill', d => DARK_MODE_COLORS[d.category] ?? '#999')
      .attr('opacity', 0.70); // Emissive alpha transparency glow
  }

  render(data);

  function update(newData) { render(newData); }
  function destroy() { tooltip.destroy(); wrapper.selectAll('*').remove(); }

  return { update, destroy };
}