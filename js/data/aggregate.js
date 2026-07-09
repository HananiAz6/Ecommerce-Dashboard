// js/data/aggregate.js
// Every rollup/groupby in the entire dashboard goes through this file.
// Reason: Task requirement is that axis ticks/bars never duplicate — the only way
// to guarantee that is to have exactly one function that defines "grouped by month"
// and have every chart (child bar chart, revenue trend, KPI cards) call it.

/**
 * Sums revenue per calendar month, sorted chronologically.
 * Returns [ [ '2023-01', totalRevenue ], [ '2023-02', totalRevenue ], ... ]
 */
export function revenueByMonth(rows) {
  const monthKey = d3.timeFormat('%Y-%m');
  const rolled = d3.rollups(
    rows,
    (v) => d3.sum(v, (d) => d.revenue),
    (d) => monthKey(d.date)
  );
  return rolled.sort((a, b) => d3.ascending(a[0], b[0]));
}

/**
 * Order count per calendar month (used by the child-mode "Packages" bar chart
 * and by the adult fulfillment chart).
 */
export function ordersByMonth(rows) {
  const monthKey = d3.timeFormat('%Y-%m');
  const rolled = d3.rollups(
    rows,
    (v) => v.length,
    (d) => monthKey(d.date)
  );
  return rolled.sort((a, b) => d3.ascending(a[0], b[0]));
}

/**
 * Revenue by Category — for the Adult "Sales by Category" bar chart and as the
 * source for Child mode's simplified category buttons' totals.
 */
export function revenueByCategory(rows) {
  return d3.rollups(
    rows,
    (v) => d3.sum(v, (d) => d.revenue),
    (d) => d.category
  ).sort((a, b) => d3.descending(a[1], b[1]));
}

/**
 * Revenue by Region x Category — feeds the Regional Performance Matrix heat map.
 * Returns a flat array of {region, category, revenue} so d3 can key a grid directly.
 */
export function revenueByRegionCategory(rows) {
  const nested = d3.rollups(
    rows,
    (v) => d3.sum(v, (d) => d.revenue),
    (d) => d.region,
    (d) => d.category
  );
  const flat = [];
  nested.forEach(([region, categories]) => {
    categories.forEach(([category, revenue]) => {
      flat.push({ region, category, revenue });
    });
  });
  return flat;
}

/**
 * Age-bucket x Gender counts — feeds Customer Segments chart.
 * Rows with null age are excluded (documented data-cleaning decision), not
 * bucketed into a fake group.
 */
export function segmentsByAgeGender(rows) {
  const buckets = [
    { label: '18-25', min: 18, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-55', min: 46, max: 55 },
    { label: '56-65', min: 56, max: 65 },
    { label: '66+', min: 66, max: Infinity },
  ];
  const bucketOf = (age) => buckets.find((b) => age >= b.min && age <= b.max)?.label ?? 'Unknown';

  const withAge = rows.filter((d) => d.age !== null);
  const nested = d3.rollups(
    withAge,
    (v) => v.length,
    (d) => bucketOf(d.age),
    (d) => d.gender
  );

  const flat = [];
  nested.forEach(([ageGroup, genders]) => {
    genders.forEach(([gender, count]) => {
      flat.push({ ageGroup, gender, count });
    });
  });
  return flat;
}

/**
 * Return-rate per category — Adult KPI card + Elderly KPI card (same data,
 * different font size, applied by the chart's config not by a different function).
 */
export function returnRateByCategory(rows) {
  return d3.rollups(
    rows,
    (v) => {
      const returned = v.filter((d) => d.shippingStatus === 'Returned').length;
      return returned / v.length;
    },
    (d) => d.category
  );
}

/**
 * Delivery status breakdown — feeds the Child mode "Delivery Progress Bar"
 * and the Adult "Fulfillment Logistics" chart.
 */
export function deliveryStatusBreakdown(rows) {
  return d3.rollups(
    rows,
    (v) => v.length,
    (d) => d.shippingStatus
  );
}

/**
 * Simple linear-regression forecast appended after the last known month.
 * Kept in aggregate.js (not the chart file) because it's a data transform,
 * not a drawing concern — the chart just plots whatever array it's given.
 *
 * @param {Array<[string, number]>} monthly - output of revenueByMonth()
 * @param {number} monthsAhead - how many future months to project
 * @returns {Array<[string, number]>} monthsAhead entries, keyed by 'YYYY-MM'
 */
export function forecastNextMonths(monthly, monthsAhead = 2) {
  if (monthly.length < 2) return [];

  // x = index 0..n-1, y = revenue. Ordinary least squares slope/intercept.
  const n = monthly.length;
  const xs = d3.range(n);
  const ys = monthly.map((d) => d[1]);
  const xMean = d3.mean(xs);
  const yMean = d3.mean(ys);
  const num = d3.sum(xs.map((x, i) => (x - xMean) * (ys[i] - yMean)));
  const den = d3.sum(xs.map((x) => (x - xMean) ** 2));
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  const lastMonth = monthly[n - 1][0];
  const parseMonth = d3.timeParse('%Y-%m');
  const formatMonth = d3.timeFormat('%Y-%m');
  const lastDate = parseMonth(lastMonth);

  const forecast = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = d3.timeMonth.offset(lastDate, i);
    const predicted = Math.max(0, slope * (n - 1 + i) + intercept);
    forecast.push([formatMonth(futureDate), predicted]);
  }
  return forecast;
}

/**
 * Top-level KPI numbers — Filtered Revenue, Filtered Orders, AOV, Return Rate.
 * Kept as one function so every KPI card reads from the same computed object
 * instead of each card re-deriving its own number slightly differently.
 */
export function summaryKpis(rows) {
  const revenue = d3.sum(rows, (d) => d.revenue);
  const orders = rows.length;
  const aov = orders > 0 ? revenue / orders : 0;
  const returned = rows.filter((d) => d.shippingStatus === 'Returned').length;
  const returnRate = orders > 0 ? returned / orders : 0;

  return { revenue, orders, aov, returnRate };
}
