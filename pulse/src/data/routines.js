/**
 * DM26 Planner: routines and rituals.
 *
 * Routine = has a start and end time (e.g. MWD on site 5:00 AM - 6:00 PM).
 * Ritual  = no times (e.g. Rise to Shine, Gratitude).
 * Each one can hold steps (label + optional time), added with +.
 * MWD times are the day-shift version; nights flips them automatically.
 */
const KEY = 'monk.routines';

export const NAME_SUGGESTIONS = ['HQ', 'MWD', 'Relax', 'Recover', 'Travel', 'MWD - Rig Move'];

export const PLACES = [
  { key: 'hq', label: 'HQ' },
  { key: 'mwd', label: 'MWD' },
  { key: 'both', label: 'Both' },
];

// Starter examples (only on first open) so there's something to try and break
const SAMPLES = [
  {
    id: 'sample-mwd-onsite', kind: 'routine', name: 'MWD (On Site)', place: 'mwd',
    start: '05:00', end: '18:00',
    description: 'Standard day on the rig. Make a plan, stick to it.',
    steps: [
      { id: 's1', label: 'Rise to Shine', time: '05:00' },
      { id: 's2', label: 'Start MWD', time: '06:00' },
      { id: 's3', label: 'Check In #1 + Breakfast', time: '09:00' },
      { id: 's4', label: 'Start 10 × 3 on the HH', time: '09:30' },
      { id: 's5', label: '1.5 × Launch!', time: '09:30' },
      { id: 's6', label: 'Check In #2', time: '13:00' },
      { id: 's7', label: 'End of Shift Preparation', time: '17:30' },
    ],
  },
  {
    id: 'sample-rise-shine', kind: 'ritual', name: 'Rise to Shine', place: 'both',
    description: 'Morning ritual. Water before coffee.',
    steps: [
      { id: 'r1', label: 'Water before coffee' },
      { id: 'r2', label: 'Headspace × 3' },
    ],
  },
];

export function loadRoutines() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return SAMPLES.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s })) }));
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export function saveRoutines(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export const newId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
