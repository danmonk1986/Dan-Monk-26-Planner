import { itemsForDay, isItemDone, routineDayKey } from './nonNegotiables';
import { viceWeight } from './logTypes';

/**
 * Baseline -> dip -> bounce back (the Mental Toughness curve).
 *
 * A routine day is ON BASELINE when at least BASELINE_PCT of that day's
 * Non-Negotiables are done (Hara Hachi Bu: 80%) AND vices stay within the
 * daily tolerance. Anything else is a DIP: no shame, just evidence.
 * A finished day with nothing logged at all is also a dip.
 */
export const BASELINE_PCT = 0.8;
const TOLERANCE_KEY = 'monk.viceTolerance';
const DAY_MODES_KEY = 'monk.dayModes';

export function loadTolerance() {
  try {
    const v = parseFloat(localStorage.getItem(TOLERANCE_KEY));
    return Number.isFinite(v) && v >= 0 ? v : 1;
  } catch { return 1; }
}
export function saveTolerance(v) {
  try { localStorage.setItem(TOLERANCE_KEY, String(v)); } catch { /* ignore */ }
}

// Remember which mode each day was lived in (used by the Summary)
export function recordDayMode(day, mode) {
  try {
    const all = JSON.parse(localStorage.getItem(DAY_MODES_KEY) || '{}');
    const tag = mode.place === 'mwd' ? `mwd-${mode.shift}` : 'hq';
    if (all[day] !== tag) {
      all[day] = tag;
      localStorage.setItem(DAY_MODES_KEY, JSON.stringify(all));
    }
  } catch { /* ignore */ }
}
export function loadDayModes() {
  try { return JSON.parse(localStorage.getItem(DAY_MODES_KEY) || '{}'); } catch { return {}; }
}

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return keyOf(new Date(y, m - 1, d + n));
}

// Weighted vice load per routine day: quantity × weight (Light 0.5, Medium 1, Heavy 3)
export function vicesByDay(entries, mode) {
  const out = {};
  entries.forEach((e) => {
    if (e.type !== 'vices') return;
    const d = routineDayKey(mode, new Date(e.timestamp));
    out[d] = Math.round(((out[d] || 0) + (e.qty || 1) * viceWeight(e)) * 100) / 100;
  });
  return out;
}

// First day with any evidence (a tick or a log entry)
export function firstDay(ticks, entries, mode) {
  const days = Object.keys(ticks).filter((d) => Object.values(ticks[d] || {}).some(Boolean));
  entries.forEach((e) => days.push(routineDayKey(mode, new Date(e.timestamp))));
  return days.length ? days.sort()[0] : null;
}

/**
 * Status of one routine day:
 *  'none'     before tracking started
 *  'today'    still in progress (onTrack tells if it's at baseline so far)
 *  'baseline' / 'dip'
 */
export function dayStatus(day, { items, ticks, totals, vices, tolerance, today, start, hasEntry }) {
  const list = itemsForDay(items, day);
  const done = list.filter((i) => isItemDone(i.id, day, ticks, totals)).length;
  const total = list.length;
  const v = vices[day] || 0;
  const meets = total > 0 && done / total >= BASELINE_PCT && v <= tolerance;
  const base = { day, done, total, vices: v, meets };
  if (!start || day < start) return { ...base, status: 'none' };
  if (day === today) return { ...base, status: 'today' };
  const anyEvidence = done > 0 || v > 0 || hasEntry(day);
  return { ...base, status: meets && anyEvidence ? 'baseline' : 'dip' };
}

/**
 * The curve over time, up to and including today:
 *  run        consecutive baseline days ending with the most recent finished day
 *  dipDays    if currently in a dip: how many days so far
 *  lastBounce days it took to get back the last time
 */
export function curve(statusOf, today, start) {
  if (!start) return { run: 0, dipDays: 0, lastBounce: null };
  const days = [];
  for (let d = start; d < today; d = addDays(d, 1)) days.push(statusOf(d).status);

  let lastBounce = null;
  let dipLen = 0;
  days.forEach((s) => {
    if (s === 'dip') dipLen++;
    else if (s === 'baseline') {
      if (dipLen > 0) lastBounce = dipLen;
      dipLen = 0;
    }
  });
  let run = 0;
  for (let i = days.length - 1; i >= 0 && days[i] === 'baseline'; i--) run++;
  return { run, dipDays: dipLen, lastBounce };
}
