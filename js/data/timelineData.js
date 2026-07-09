// js/data/timelineData.js
// Static project-management data (not derived from the sales CSV). Dates are
// set relative to the assignment's 20 July 2026 due date, covering the
// "last 5 months" the brief asks for.
//
// status: 'done' | 'active' | 'upcoming' — drives color + icon in timeline.js

export const timelineMilestones = [
  {
    id: 'initiation',
    title: 'Project Initiation',
    date: '2026-02-15',
    endDate: '2026-02-28',
    status: 'done',
    description: 'Defined the stakeholder brief, selected the E-Commerce domain, and scoped the three user profiles (Adult, Early Childhood, Elderly).',
  },
  {
    id: 'collection',
    title: 'Data Collection',
    date: '2026-03-01',
    endDate: '2026-03-20',
    status: 'done',
    description: 'Sourced the e-commerce sales dataset (1,000 transactions: region, category, product, pricing, shipping status).',
  },
  {
    id: 'cleaning',
    title: 'Data Cleaning',
    date: '2026-03-21',
    endDate: '2026-04-15',
    status: 'done',
    description: 'Handled missing Region/Age/Shipping Status values and recomputed 20 rows with corrupted Total Price figures.',
  },
  {
    id: 'development',
    title: 'Dashboard Development',
    date: '2026-04-16',
    endDate: '2026-06-15',
    status: 'done',
    description: 'Built the modular D3.js engine: state management, the 6-chart Adult grid, Child mode, and Elderly mode.',
  },
  {
    id: 'testing',
    title: 'Testing and Validation',
    date: '2026-06-16',
    endDate: '2026-07-10',
    status: 'active',
    description: 'Verifying cross-filtering, zoom/pan, DOM-clearing between profiles, and accessibility across all three user modes.',
  },
  {
    id: 'deployment',
    title: 'Deployment / Presentation',
    date: '2026-07-20',
    endDate: '2026-07-20',
    status: 'upcoming',
    description: 'Final submission and live class demonstration (Week 11).',
  },
];
