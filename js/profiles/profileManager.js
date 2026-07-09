// js/profiles/profileManager.js
// This is the answer to "child mode must be completely removed from the DOM,
// not just hidden." Every profile module's mount() returns an array of
// { update, destroy }. On switch, we call destroy() on everything currently
// mounted (which removes its own DOM nodes + D3 event listeners), THEN
// hard-clear the container elements as a belt-and-braces guarantee, THEN
// mount the new profile fresh.

import * as adult from './adult.js';
import * as child from './child.js';
import * as elderly from './elderly.js';
import * as state from '../state.js';

const profiles = { adult, child, elderly };

let currentMounts = [];
let els = null; // { kpiEl, sidebarEl, gridEl }

export function init(elements) {
  els = elements;
  switchProfile(state.getProfile());

  // Any filter change re-renders every currently mounted chart with fresh data.
  state.subscribe(() => {
    const data = state.filteredData();
    currentMounts.forEach((m) => m.update(data));
  });
}

export function switchProfile(newProfile) {
  state.setProfile(newProfile);

  // 1. Destroy everything the previous profile mounted.
  currentMounts.forEach((m) => m.destroy());
  currentMounts = [];

  // 2. Hard-clear containers — belt and braces beyond individual destroy()s,
  //    guarantees no stray nodes survive a bug in any one chart's cleanup.
  els.kpiEl.replaceChildren();
  els.sidebarEl.replaceChildren();
  els.gridEl.replaceChildren();
  els.timelineEl.replaceChildren();

  // 3. Mount the new profile fresh.
  const mod = profiles[newProfile];
  if (!mod) {
    console.error(`Unknown profile: ${newProfile}`);
    return;
  }
  currentMounts = mod.mount(els, state.getRawData() ?? [], state.filteredData());

  document.body.setAttribute('data-profile', newProfile);
}
