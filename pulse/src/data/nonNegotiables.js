import { resolveTime } from '../lib/shiftTime';

/**
 * Non-negotiables: the daily baseline, the same at HQ and MWD. Only the times
 * change with mode (see lib/shiftTime). Times are the day-shift version.
 *
 * Items are never hard-deleted: removing one sets `removedOn`, so past days
 * keep their ticks and history never changes after the fact.
 */

export const SECTIONS = [
  { key: 'morning', label: 'Morning', checkIn: '09:00' },
  { key: 'midday', label: 'Midday', checkIn: '13:00' },
  { key: 'evening', label: 'Evening', checkIn: '18:00' },
];

export const DEFAULT_ITEMS = [
  { id: 'wake', label: 'Wake Up', section: 'morning', anchor: 'wake' },
  { id: 'rise-shine', label: 'Rise to Shine Ritual', section: 'morning' },
  { id: 'power-up', label: 'Power Up', section: 'morning' },
  { id: 'water-coffee', label: 'Water Before Coffee', section: 'morning' },
  { id: 'productivity', label: '1 Productivity Block', section: 'midday', time: '09:30' },
  { id: 'activity', label: 'Activity 3 × 10', section: 'midday', weekly: 4 },
  { id: 'water-pills', label: 'Water + Pills', section: 'evening', time: '19:30' },
  { id: 'chill', label: 'Power Down', section: 'evening' },
  { id: 'gratitude', label: 'Gratitude Ritual', section: 'evening' },
  { id: 'bed', label: 'Bed', section: 'evening', anchor: 'bed' },
];

// Title Case every word except "to" (e.g. "Rise to Shine Ritual")
export const titleCase = (text) =>
  text.split(' ').map((w, i) => (i > 0 && w.toLowerCase() === 'to' ? 'to' : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

const ITEMS_KEY = 'monk.nn.items';
const TICKS_KEY = 'monk.nn.ticks';

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v ?? fallback;
  } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export const loadItems = () => {
  const items = read(ITEMS_KEY, null);
  if (!Array.isArray(items)) return DEFAULT_ITEMS.map((i) => ({ ...i }));
  // v2: "Chill time" became "Power Down"; Water Before Coffee moved to the end of Morning
  const order = DEFAULT_ITEMS.map((d) => d.id);
  // Built-in items in default order; added items keep their order after them
  const rank = (i, idx) => (order.includes(i.id) ? order.indexOf(i.id) : 1000 + idx);
  return items
    .map((i) => (i.id === 'chill' && /^chill time/i.test(i.label) ? { ...i, label: 'Power Down' } : i))
    .map((i, idx) => ({ i, r: rank(i, idx) }))
    .sort((a, b) => a.r - b.r)
    .map(({ i }) => i);
};
export const saveItems = (items) => write(ITEMS_KEY, items);
export const loadTicks = () => read(TICKS_KEY, {});
export const saveTicks = (ticks) => write(TICKS_KEY, ticks);

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * The "routine day" a moment belongs to. A day runs from 4:00 to 4:00
 * (4 PM to 4 PM on MWD nights), so a 1 AM tick on nights, or a late bedtime
 * at HQ, counts toward the day it belongs to, not the calendar date.
 */
function boundaryHours(mode) {
  const [h, m] = resolveTime('04:00', mode).split(':').map(Number);
  return h + m / 60;
}
export function routineDayKey(mode, now = new Date()) {
  const shifted = new Date(now.getTime() - boundaryHours(mode) * 3600000);
  return dateKey(shifted);
}

// Which section is "now": Morning until 9:30, Midday until 6 PM, then Evening
export function currentSection(mode, now = new Date()) {
  const b = boundaryHours(mode);
  const hoursIn = ((now.getHours() + now.getMinutes() / 60 - b) % 24 + 24) % 24;
  if (hoursIn < 5.5) return 'morning';
  if (hoursIn < 14) return 'midday';
  return 'evening';
}

// Items that apply on a given routine day
export const itemsForDay = (items, day) =>
  items.filter((i) => (!i.addedOn || i.addedOn <= day) && (!i.removedOn || day < i.removedOn));

/**
 * Items that tick themselves from log entries.
 * Productivity: 1 block logged that day. Activity: 30 min logged that day
 * (steps don't count). The target comes from here, not the label.
 */
export const AUTO_RULES = {
  productivity: { type: 'productivity', target: 1, unit: 'block' },
  activity: { type: 'gym', target: 30, unit: 'min' },
};

// { 'YYYY-MM-DD': { productivity: 1.5, gym: 40 } } by routine day
export function totalsByDay(entries, mode) {
  const out = {};
  const types = new Set(Object.values(AUTO_RULES).map((r) => r.type));
  entries.forEach((e) => {
    if (!types.has(e.type)) return;
    const d = routineDayKey(mode, new Date(e.timestamp));
    out[d] = out[d] || {};
    out[d][e.type] = (out[d][e.type] || 0) + e.value;
  });
  return out;
}

// Done = the log met the target (loggable items: the log is the only proof),
// or ticked by hand (everything else)
export function isItemDone(itemId, day, ticks, totals) {
  const rule = AUTO_RULES[itemId];
  if (rule) return (totals[day]?.[rule.type] || 0) >= rule.target;
  return !!ticks[day]?.[itemId];
}

// One-tap log for loggable items: Productivity 1 block, Activity 10 min × 3
export const LOG_PREFILL = {
  productivity: { type: 'productivity', value: '1', qty: 1 },
  activity: { type: 'gym', value: '10', qty: 3 },
};

// Days done for one item over the 7 routine days ending on `day`
export function weeklyCount(ticks, itemId, day, totals = {}) {
  const [y, m, d] = day.split('-').map(Number);
  let count = 0;
  for (let k = 0; k < 7; k++) {
    if (isItemDone(itemId, dateKey(new Date(y, m - 1, d - k)), ticks, totals)) count++;
  }
  return count;
}
