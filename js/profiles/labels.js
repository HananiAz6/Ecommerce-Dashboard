// js/profiles/labels.js
// Per the progress doc: Child mode swaps business terminology for kid-friendly
// words. This is the ONLY place that mapping is defined. Chart modules accept
// a `labels` object in their config and never hardcode strings themselves.

export const ADULT_LABELS = {
  revenue: 'Revenue',
  orders: 'Orders',
  aov: 'Avg Order Value',
  returnRate: 'Segment Return Rate',
};

export const ELDERLY_LABELS = ADULT_LABELS; // same wording, different font/contrast only

export const CHILD_LABELS = {
  revenue: 'Money Earned 💰',
  orders: 'Packages 📦',
  aov: 'Money per Package 💵',
  returnRate: 'Returned Items ↩️',
};
