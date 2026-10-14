/**
 * Shift-aware times.
 *
 * HQ runs on fixed clock times. MWD runs 6 to 6 on days or nights, and every
 * MWD time flips AM/PM with the shift. Times are written as 24h "HH:MM" for
 * the DAY version; nights adds 12 hours.
 */

export const SHIFT_HOURS = { start: '06:00', end: '18:00' };

// Shift a "HH:MM" by 12h when on nights at MWD.
export function resolveTime(hhmm, mode) {
  if (!hhmm) return hhmm;
  if (mode.place !== 'mwd' || mode.shift !== 'nights') return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  return `${String((h + 12) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// "17:30" -> "5:30 PM"
export function formatClock(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Resolve + format in one step
export const shiftClock = (hhmm, mode) => formatClock(resolveTime(hhmm, mode));

// Wake and bed per mode (MWD values are the day-shift version)
const ANCHORS = {
  hq: { wake: '08:00', bed: '23:00' },
  mwd: { wake: '05:30', bed: '21:00' },
};

export function dayAnchors(mode) {
  const a = ANCHORS[mode.place] || ANCHORS.hq;
  return { wake: shiftClock(a.wake, mode), bed: shiftClock(a.bed, mode) };
}

export function modeLabel(mode) {
  if (mode.place === 'hq') return 'HQ';
  return `MWD · ${mode.shift === 'nights' ? 'Nights' : 'Days'}`;
}
