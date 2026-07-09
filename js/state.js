// js/state.js
// The ONLY place filter values and the active profile live. Charts and filter
// controls never talk to each other directly — they all go through this module.
// That's what makes "cross-filtering" (Task 4) a one-line consequence instead of
// a web of manual wiring: change a filter -> notify() -> every mounted chart's
// update() runs against the same freshly-derived array.

const listeners = new Set();

const state = {
  rawData: [],
  profile: 'adult', // 'adult' | 'child' | 'elderly'
  filters: {
    region: 'All',
    category: 'All',
    product: 'All',
    shippingStatus: [], // empty array = no restriction (all statuses included)
    searchTerm: '',
  },
};

export function setRawData(rows) {
  state.rawData = rows;
  notify();
}

export function getRawData() {
  return state.rawData;
}

export function getProfile() {
  return state.profile;
}

/**
 * Deliberately does NOT call notify(). Profile switching is driven explicitly
 * by profileManager.switchProfile(), which destroys/remounts charts itself —
 * it doesn't need (and shouldn't get) the generic filter-change notification,
 * since that would try to update() charts that are mid-teardown.
 */
export function setProfile(profile) {
  state.profile = profile;
}

export function getFilters() {
  return { ...state.filters };
}

/** Merge a partial filter update, e.g. setFilter({ region: 'East' }) */
export function setFilter(partial) {
  state.filters = { ...state.filters, ...partial };
  notify();
}

export function resetFilters() {
  state.filters = {
    region: 'All',
    category: 'All',
    product: 'All',
    shippingStatus: [],
    searchTerm: '',
  };
  notify();
}

/**
 * The single derivation function all charts read through. Pure — never
 * mutates rawData, always returns a fresh filtered array.
 */
export function filteredData() {
  const { region, category, product, shippingStatus, searchTerm } = state.filters;

  return state.rawData.filter((d) => {
    if (region !== 'All' && d.region !== region) return false;
    if (category !== 'All' && d.category !== category) return false;
    if (product !== 'All' && d.product !== product) return false;
    if (shippingStatus.length > 0 && !shippingStatus.includes(d.shippingStatus)) return false;
    if (searchTerm && !d.product.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
}

/** Subscribe to any state change (filter, profile, or data load). Returns an unsubscribe fn. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}
