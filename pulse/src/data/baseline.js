import { itemsForDay, isItemDone, routineDayKey, loadItems, loadTicks, totalsByDay as _totalsByDay } from './nonNegotiables';
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
const TOLERANCE_KEY = 'monk.viceLimits'; // { hq, mwd }
export const DEFAULT_LIMITS = { hq: 3, mwd: 2 };
const DAY_MODES_KEY = 'monk.dayModes';

// Daily vice limit per mode: HQ 3, MWD 2 by default (editable)
export function loadTolerance() {
  try {
    const v = JSON.parse(localStorage.getItem(TOLERANCE_KEY) || 'null');
    if (v && Number.isFinite(v.hq) && Number.isFinite(v.mwd)) return v;
  } catch { /* ignore */ }
  return { ...DEFAULT_LIMITS };
}
export function saveTolerance(v) {
  try { localStorage.setItem(TOLERANCE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}
// The limit for a mode tag ('hq', 'mwd-days', 'mwd-nights')
export const limitFor = (limits, tag) => (String(tag || 'hq').startsWith('mwd') ? limits.mwd : limits.hq);

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
export function dayStatus(day, { items, ticks, totals, vices, tolerance: tolOf, today, start, hasEntry }) {
  const tolerance = typeof tolOf === 'function' ? tolOf(day) : tolOf;
  const list = itemsForDay(items, day);
  const done = list.filter((i) => isItemDone(i.id, day, ticks, totals)).length;
  const total = list.length;
  const v = vices[day] || 0;
  const meets = total > 0 && done / total >= BASELINE_PCT && v <= tolerance;
  const base = { day, done, total, vices: v, limit: tolerance, meets };
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

/* ───────────────────────── Summary ───────────────────────── */


/**
 * Every tracked routine day from the first one to today, with its result.
 * Each finished day is judged by the mode it was lived in.
 */
export function buildHistory(entries, mode, now = new Date()) {
  const items = loadItems();
  const ticks = loadTicks();
  const totals = _totalsByDay(entries, mode);
  const vices = vicesByDay(entries, mode);
  const dayModes = loadDayModes();
  const limits = loadTolerance();
  const today = routineDayKey(mode, now);
  const start = firstDay(ticks, entries, mode);
  const modeTag = mode.place === 'mwd' ? `mwd-${mode.shift}` : 'hq';
  const entryDays = new Set(entries.map((e) => routineDayKey(mode, new Date(e.timestamp))));
  const tagOf = (d) => (d === today ? modeTag : dayModes[d] || 'unrecorded');
  const ctx = {
    items, ticks, totals, vices, today, start,
    tolerance: (d) => limitFor(limits, tagOf(d)),
    hasEntry: (d) => entryDays.has(d),
  };
  const statusOf = (d) => dayStatus(d, ctx);

  const days = [];
  if (start) {
    for (let d = start; d <= today; d = addDays(d, 1)) {
      const s = statusOf(d);
      days.push({
        ...s,
        tag: tagOf(d),
        blocks: totals[d]?.productivity || 0,
        activityMin: totals[d]?.gym || 0,
      });
    }
  }
  return { days, today, start, arc: curve(statusOf, today, start) };
}

// Lengths of each dip that ended back on baseline
export function bounceBacks(days) {
  const out = [];
  let len = 0;
  days.forEach((d) => {
    if (d.status === 'dip') len++;
    else if (d.status === 'baseline') { if (len > 0) out.push(len); len = 0; }
  });
  return out;
}

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// Aggregate finished days (not today) into one row of stats
export function summarize(days) {
  const done = days.filter((d) => d.status === 'baseline' || d.status === 'dip');
  const bb = bounceBacks(days);
  return {
    days: done.length,
    hitRate: done.length ? done.filter((d) => d.status === 'baseline').length / done.length : null,
    completion: avg(done.map((d) => (d.total ? d.done / d.total : 0))),
    viceLoad: avg(done.map((d) => d.vices)),
    blocks: avg(done.map((d) => d.blocks)),
    activityDays: done.filter((d) => d.activityMin >= 30).length,
    bounceBack: avg(bb),
    dips: bb.length,
  };
}

export const MODE_GROUPS = [
  { key: 'hq', label: 'HQ', match: (t) => t === 'hq' },
  { key: 'mwd', label: 'MWD', match: (t) => String(t).startsWith('mwd') },
  { key: 'mwd-days', label: 'MWD · Days', match: (t) => t === 'mwd-days', sub: true },
  { key: 'mwd-nights', label: 'MWD · Nights', match: (t) => t === 'mwd-nights', sub: true },
];
