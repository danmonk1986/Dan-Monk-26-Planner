import BoltIcon from '@mui/icons-material/Bolt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BlockIcon from '@mui/icons-material/Block';

/**
 * The one list of things you can log, in display order. Dashboard cards,
 * the Log form and History all read from here.
 *
 * `value` is the stored entry type. Activity keeps the stored type 'gym'
 * (the Workout Planner's check-ins use it), Rest keeps 'sleep' and H2O keeps
 * 'water', so existing entries carry straight over. Steps is retired: old
 * steps entries stay in storage but are no longer shown.
 */
export const LOG_TYPES = [
  { value: 'productivity', label: 'Productivity', icon: BoltIcon,          unit: 'hours',   step: 0.25, placeholder: 'e.g. 3.5' },
  { value: 'gym',          label: 'Activity',     icon: FitnessCenterIcon, unit: 'min',     step: 1,    placeholder: 'e.g. 45' },
  { value: 'sleep',        label: 'Rest',         icon: BedtimeIcon,       unit: 'hours',   step: 0.1,  placeholder: 'e.g. 7.5' },
  { value: 'food',         label: 'Food',         icon: RestaurantIcon,    unit: 'kcal',    step: 1,    placeholder: 'e.g. 450' },
  { value: 'water',        label: 'H2O',          icon: WaterDropIcon,     unit: 'ml',      step: 1,    placeholder: 'e.g. 250' },
  { value: 'vices',        label: 'Vices',        icon: BlockIcon,         unit: 'count',   step: 1,    placeholder: 'e.g. 1' },
];

export const LOG_TYPE_MAP = Object.fromEntries(LOG_TYPES.map((t) => [t.value, t]));
export const isShownType = (type) => Boolean(LOG_TYPE_MAP[type]);
