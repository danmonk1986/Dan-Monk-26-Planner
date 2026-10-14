import BoltIcon from '@mui/icons-material/Bolt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BlockIcon from '@mui/icons-material/Block';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CoffeeIcon from '@mui/icons-material/Coffee';

/**
 * The one list of things you can log, in display order. Dashboard cards,
 * the Log form and History all read from here.
 *
 * `value` is the stored entry type. Activity keeps the stored type 'gym'
 * (the Workout Planner's check-ins use it), Rest keeps 'sleep' and H2O keeps
 * 'water', so existing entries carry straight over. Steps are logged as an
 * option under Activity (STEPS_TYPE below).
 */
export const LOG_TYPES = [
  // 1 block = 1.5 hours of focused work; quarter blocks allowed
  { value: 'productivity', label: 'Productivity', icon: BoltIcon,          unit: 'blocks',  step: 0.25, placeholder: 'e.g. 2 (1 block = 1.5 h)' },
  { value: 'gym',          label: 'Activity',     icon: FitnessCenterIcon, unit: 'min',     step: 1,    placeholder: 'e.g. 45' },
  { value: 'sleep',        label: 'Rest',         icon: BedtimeIcon,       unit: 'hours',   step: 0.1,  placeholder: 'e.g. 7.5' },
  { value: 'food',         label: 'Food',         icon: RestaurantIcon,    unit: 'kcal',    step: 1,    placeholder: 'e.g. 450' },
  { value: 'water',        label: 'H2O',          icon: WaterDropIcon,     unit: 'ml',      step: 1,    placeholder: 'e.g. 250' },
  { value: 'vices',        label: 'Vices',        icon: BlockIcon,         unit: 'count',   step: 1,    placeholder: 'e.g. 1' },
];

// Logged under Activity as an option (its own stored type, so steps never
// count as a planner workout and minutes and steps are never added together)
export const STEPS_TYPE = { value: 'steps', label: 'Steps', icon: DirectionsWalkIcon, unit: 'steps', step: 1, placeholder: 'e.g. 8000', parent: 'gym' };

// Logged under Rest as an option: short breaks (30:5 work-to-rest), kept
// separate from sleep hours so neither number gets muddied
export const BREAK_TYPE = { value: 'break', label: 'Break', icon: CoffeeIcon, unit: 'min', step: 1, placeholder: 'e.g. 5', parent: 'sleep', defaultValue: '5' };

export const LOG_TYPE_MAP = Object.fromEntries([...LOG_TYPES, STEPS_TYPE, BREAK_TYPE].map((t) => [t.value, t]));
// Vice weights: how far a vice pulls me off baseline (load vs my daily limit)
export const VICE_WEIGHTS = [
  { key: 'light', label: 'Light', short: 'L', weight: 0.5 },
  { key: 'medium', label: 'Medium', short: 'M', weight: 1 },
  { key: 'heavy', label: 'Heavy', short: 'H', weight: 3 },
];
export const viceWeight = (e) => (VICE_WEIGHTS.find((w) => w.key === e.weight) || VICE_WEIGHTS[1]).weight;
export const viceShort = (e) => (VICE_WEIGHTS.find((w) => w.key === e.weight) || VICE_WEIGHTS[1]).short;

// Remember the weight I used last time for each vice note
const VICE_MEMORY_KEY = 'monk.viceWeights';
export function rememberedWeight(note) {
  try { return JSON.parse(localStorage.getItem(VICE_MEMORY_KEY) || '{}')[note.trim().toLowerCase()] || null; } catch { return null; }
}
export function rememberWeight(note, weight) {
  try {
    const all = JSON.parse(localStorage.getItem(VICE_MEMORY_KEY) || '{}');
    all[note.trim().toLowerCase()] = weight;
    localStorage.setItem(VICE_MEMORY_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export const isShownType = (type) => Boolean(LOG_TYPE_MAP[type]);
