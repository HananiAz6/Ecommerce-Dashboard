// js/data/load.js
// Single responsibility: fetch the raw CSV and hand back clean, typed row objects.
// Nothing in here knows about profiles, filters, or charts.

/**
 * Loads and cleans the e-commerce dataset.
 * Cleaning decisions (documented for your report's "Data Cleaning" section):
 *   - Region missing (50 rows)         -> labeled "Unknown" (kept, not dropped, so
 *                                          totals still reconcile against Task 7's
 *                                          regional analysis; filter UI can exclude it)
 *   - Shipping Status missing (50 rows)-> labeled "Unknown"
 *   - Age missing (100 rows)           -> left as null; age-based charts (Customer
 *                                          Segments) skip null rows explicitly rather
 *                                          than guessing an age
 *   - Total Price mismatch (20 rows)   -> recomputed as Unit Price * Quantity, since
 *                                          that's the ground-truth formula and the
 *                                          stored value is the corrupted field
 *   - Order Date                        -> parsed to a real Date object once, here,
 *                                          so every chart downstream can rely on d.date
 *                                          being a Date, never a string
 *
 * @param {string} url - path to the CSV file
 * @returns {Promise<Array<Object>>} cleaned rows
 */
export async function loadDataset(url = './data/ecommerce_sales.csv') {
  const parseDate = d3.timeParse('%Y-%m-%d');

  const raw = await d3.csv(url, (d) => {
    const unitPrice = +d['Unit Price'];
    const quantity = +d['Quantity'];

    return {
      customerId: d['Customer ID'],
      gender: d['Gender'],
      region: d['Region'] && d['Region'].trim() ? d['Region'].trim() : 'Unknown',
      age: d['Age'] === '' || d['Age'] == null ? null : +d['Age'],
      product: d['Product Name'],
      category: d['Category'],
      unitPrice,
      quantity,
      // recomputed, not trusted from source — see note above
      revenue: +(unitPrice * quantity).toFixed(2),
      shippingFee: +d['Shipping Fee'],
      shippingStatus: d['Shipping Status'] && d['Shipping Status'].trim()
        ? d['Shipping Status'].trim()
        : 'Unknown',
      date: parseDate(d['Order Date']),
    };
  });

  return raw;
}

/**
 * Returns a small data-quality summary — useful to print once at startup
 * and to quote directly in your report's cleaning section.
 */
export function dataQualityReport(rows) {
  const total = rows.length;
  const missingRegion = rows.filter((d) => d.region === 'Unknown').length;
  const missingAge = rows.filter((d) => d.age === null).length;
  const missingShipping = rows.filter((d) => d.shippingStatus === 'Unknown').length;

  return {
    totalRows: total,
    missingRegion,
    missingAge,
    missingShipping,
    dateRange: d3.extent(rows, (d) => d.date),
  };
}
