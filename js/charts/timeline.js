// js/charts/timeline.js
import { timelineMilestones } from '../data/timelineData.js';
import { createTooltip } from '../utils/tooltip.js';

const STATUS_STYLE = {
  done: { color: '#34d399', label: 'Completed' },
  active: { color: '#fbbf24', label: 'In Progress' },
  upcoming: { color: '#94a3b8', label: 'Upcoming' },
};

export function createTimeline(container, config = {}) {
  const title = config.title ?? 'Project Progress Timeline';
  const largeMode = config.largeMode ?? false;

  const wrapper = d3.select(container)
    .attr('class', 'chart-card rounded-lg p-4')
    .style('background', 'var(--surface)')
    .style('border', '1px solid var(--grid-line)')
    .style('margin-top', 'var(--chart-gap)');

  wrapper.append('div')
    .attr('class', 'chart-title font-semibold mb-1')
    .style('color', 'var(--text-primary)')
    .style('font-size', `calc(${largeMode ? 1.2 : 1}rem * var(--font-scale))`)
    .text(title);

  // Legend
  const legend = wrapper.append('div').attr('class', 'flex flex-wrap gap-4 mb-2');
  Object.entries(STATUS_STYLE).forEach(([, style]) => {
    const item = legend.append('div').attr('class', 'flex items-center gap-1.5');
    item.append('span')
      .style('width', '10px').style('height', '10px').style('border-radius', '50%')
      .style('background', style.color).style('display', 'inline-block');
    item.append('span')
      .style('font-size', `calc(${largeMode ? 0.95 : 0.75}rem * var(--font-scale))`)
      .style('color', 'var(--text-secondary)')
      .text(style.label);
  });

  const chartBox = wrapper.append('div').style('position', 'relative');

  const width = config.width ?? 900;
  const height = config.height ?? (largeMode ? 220 : 160);
  const margin = { top: largeMode ? 60 : 45, right: 40, bottom: largeMode ? 60 : 45, left: 40 };
  const innerW = width - margin.left - margin.right;
  const midY = margin.top + (height - margin.top - margin.bottom) / 2;

  const svg = chartBox.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', 'auto');

  const tooltip = createTooltip(chartBox.node());
  const detailPanel = wrapper.append('div')
    .attr('class', 'timeline-detail mt-3 p-3 rounded')
    .style('background', 'var(--bg)')
    .style('border', '1px solid var(--grid-line)')
    .style('display', 'none');

  const parseDate = d3.timeParse('%Y-%m-%d');
  const dates = timelineMilestones.map((d) => parseDate(d.date));
  const xScale = d3.scaleTime()
    .domain(d3.extent(dates))
    .range([margin.left, width - margin.right]);

  // Base axis line
  svg.append('line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', midY).attr('y2', midY)
    .attr('stroke', 'var(--grid-line)')
    .attr('stroke-width', 3);

  // Progress line (solid up through "today", i.e. through the active milestone)
  const lastDoneIndex = (() => {
    let idx = -1;
    timelineMilestones.forEach((d, i) => { if (d.status !== 'upcoming') idx = i; });
    return idx;
  })();
  if (lastDoneIndex >= 0) {
    svg.append('line')
      .attr('x1', margin.left)
      .attr('x2', xScale(parseDate(timelineMilestones[lastDoneIndex].date)))
      .attr('y1', midY).attr('y2', midY)
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 3);
  }

  const nodeRadius = largeMode ? 12 : 8;

  const nodes = svg.selectAll('.milestone-node')
    .data(timelineMilestones)
    .join('g')
    .attr('class', 'milestone-node')
    .attr('transform', (d) => `translate(${xScale(parseDate(d.date))},${midY})`)
    .style('cursor', 'pointer');

  nodes.append('circle')
    .attr('r', nodeRadius)
    .attr('fill', (d) => STATUS_STYLE[d.status].color)
    .attr('stroke', 'var(--surface)')
    .attr('stroke-width', 3);

  // Pulsing ring on the active milestone to draw the eye to "where we are now"
  nodes.filter((d) => d.status === 'active')
    .append('circle')
    .attr('r', nodeRadius)
    .attr('fill', 'none')
    .attr('stroke', STATUS_STYLE.active.color)
    .attr('stroke-width', 2)
    .append('animate')
    .attr('attributeName', 'r')
    .attr('from', nodeRadius)
    .attr('to', nodeRadius + 10)
    .attr('dur', '1.6s')
    .attr('repeatCount', 'indefinite');
  nodes.filter((d) => d.status === 'active').select('circle:last-child')
    .append('animate')
    .attr('attributeName', 'opacity')
    .attr('from', 0.8)
    .attr('to', 0)
    .attr('dur', '1.6s')
    .attr('repeatCount', 'indefinite');

  // Alternate labels above/below to avoid overlap along the line.
  nodes.each(function (d, i) {
    const g = d3.select(this);
    const above = i % 2 === 0;
    const labelY = above ? -(largeMode ? 34 : 24) : (largeMode ? 34 : 24);
    const stemY2 = above ? -(nodeRadius + 4) : (nodeRadius + 4);

    g.append('line')
      .attr('x1', 0).attr('x2', 0)
      .attr('y1', 0).attr('y2', stemY2)
      .attr('stroke', 'var(--grid-line)');

    g.append('text')
      .attr('y', labelY)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-primary)')
      .style('font-size', `calc(${largeMode ? 0.95 : 0.7}rem * var(--font-scale))`)
      .style('font-weight', '600')
      .text(d.title);

    g.append('text')
      .attr('y', labelY + (above ? -14 : 14))
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .style('font-size', `calc(${largeMode ? 0.8 : 0.6}rem * var(--font-scale))`)
      .text(d3.timeFormat('%b %Y')(parseDate(d.date)));
  });

  nodes
    .on('mouseover', function (event, d) {
      d3.select(this).select('circle').transition().duration(150).attr('r', nodeRadius + 3);
      const [x, y] = d3.pointer(event, chartBox.node());
      tooltip.show(`<strong>${d.title}</strong><br/>${STATUS_STYLE[d.status].label}`, [x, y]);
    })
    .on('mouseout', function () {
      d3.select(this).select('circle').transition().duration(150).attr('r', nodeRadius);
      tooltip.hide();
    })
    .on('click', function (event, d) {
      const isOpen = detailPanel.attr('data-open') === d.id;
      if (isOpen) {
        detailPanel.style('display', 'none').attr('data-open', null);
        return;
      }
      detailPanel
        .attr('data-open', d.id)
        .style('display', 'block')
        .html(`
          <div style="font-weight:600; font-size:calc(${largeMode ? 1.05 : 0.9}rem * var(--font-scale)); color:var(--text-primary);">
            ${d.title} <span style="color:${STATUS_STYLE[d.status].color}; font-weight:600;">· ${STATUS_STYLE[d.status].label}</span>
          </div>
          <div style="font-size:calc(${largeMode ? 0.9 : 0.78}rem * var(--font-scale)); color:var(--text-secondary); margin-top:4px;">
            ${d3.timeFormat('%d %b')(parseDate(d.date))} – ${d3.timeFormat('%d %b %Y')(parseDate(d.endDate))}
          </div>
          <div style="font-size:calc(${largeMode ? 0.95 : 0.82}rem * var(--font-scale)); color:var(--text-primary); margin-top:8px;">
            ${d.description}
          </div>
        `);
    });

  function destroy() {
    tooltip.destroy();
    wrapper.selectAll('*').remove();
  }

  // Timeline data is static (not filtered by state), so update() is a no-op —
  // present for interface consistency with every other chart's {update, destroy}.
  return { update: () => {}, destroy };
}
