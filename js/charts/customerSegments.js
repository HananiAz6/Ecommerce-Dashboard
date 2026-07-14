// js/charts/customerSegments.js
import { segmentsByAgeGender } from '../data/aggregate.js';
import { createTooltip } from '../utils/tooltip.js';

const MARGIN = { top: 20, right: 20, bottom: 40, left: 45 };
const GENDER_COLORS = { Male: '#38bdf8', Female: '#f472b6' };

export function createCustomerSegmentsChart(container, data, config = {}) {
  const title = config.title ?? 'Customer Segments (Age × Gender)';

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
  const height = config.height ?? 370;
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

  const x0 = d3.scaleBand().range([0, innerW]).paddingInner(0.3);
  const x1 = d3.scaleBand().padding(0.15);
  const yScale = d3.scaleLinear().range([innerH, 0]);

  function render(newData) {
    const flat = segmentsByAgeGender(newData); // [ {ageGroup, gender, count}, ... ]
    const ageGroups = [...new Set(flat.map((d) => d.ageGroup))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const genders = [...new Set(flat.map((d) => d.gender))].sort();

    x0.domain(ageGroups);
    x1.domain(genders).range([0, x0.bandwidth()]);
    yScale.domain([0, d3.max(flat, (d) => d.count) || 1]).nice();

    xAxisG.call(d3.axisBottom(x0));
    yAxisG.call(d3.axisLeft(yScale).ticks(5));
    [xAxisG, yAxisG].forEach((axis) => {
      axis.selectAll('text')
        .style('fill', 'var(--text-secondary)')
        .style('font-size', 'calc(0.75rem * var(--font-scale))');
      axis.selectAll('path,line').style('stroke', 'var(--grid-line)');
    });

    const groups = barsLayer.selectAll('.age-group').data(ageGroups, (d) => d);
    groups.exit().remove();
    const groupsEnter = groups.enter().append('g').attr('class', 'age-group');
    const groupsMerged = groupsEnter.merge(groups)
      .attr('transform', (d) => `translate(${x0(d)},0)`);

    const bars = groupsMerged.selectAll('rect').data(
      (ageGroup) => genders.map((gender) => {
        const match = flat.find((d) => d.ageGroup === ageGroup && d.gender === gender);
        return { ageGroup, gender, count: match ? match.count : 0 };
      }),
      (d) => d.gender
    );
    bars.exit().remove();

    bars.enter()
      .append('rect')
      .attr('x', (d) => x1(d.gender))
      .attr('width', x1.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .merge(bars)
      .attr('fill', (d) => GENDER_COLORS[d.gender] ?? '#999')
      .on('mouseover', function (event, d) {
        d3.select(this).style('opacity', 0.75);
        const [x, y] = d3.pointer(event, chartBox.node());
        tooltip.show(`<strong>${d.ageGroup}, ${d.gender}</strong><br/>${d.count} orders`, [x, y]);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
        tooltip.hide();
      })
      .transition().duration(400)
      .attr('x', (d) => x1(d.gender))
      .attr('width', x1.bandwidth())
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => innerH - yScale(d.count));
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
