import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import WaterBottleIcon from '@mui/icons-material/WaterDrop';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { tokens } from '../theme';
import { LOG_TYPES, STEPS_TYPE, BREAK_TYPE, VICE_WEIGHTS, rememberedWeight, rememberWeight } from '../data/logTypes';

const TYPES = LOG_TYPES;

// My two containers: one glass, one bottle
const WATER_SIZES = [
  { key: 'glass', label: 'Glass', ml: 500 },
  { key: 'bottle', label: 'Bottle', ml: 750 },
];
// Types logged without a number: H2O picks a container, Vices count 1 per note
const NO_VALUE_TYPES = ['water', 'vices'];

/**
 * Form to add or edit a health entry.
 * Props:
 *   onSubmit    – called with the entry data ({ type, value, unit, note, timestamp })
 *   editEntry   – if provided, the form pre-fills for editing
 *   onCancel    – called when editing is cancelled
 */
export default function LogForm({ onSubmit, editEntry = null, onCancel, onClose, initialType = 'food' }) {
  const [type, setType] = useState(initialType);
  // Activity can be logged as minutes or steps
  const [activityMode, setActivityMode] = useState('minutes');
  // Rest can be logged as sleep or a break
  const [restMode, setRestMode] = useState('sleep');
  // H2O container
  const [waterSize, setWaterSize] = useState('glass');
  // Repeats in one entry: 3 × 10 min, 5 × Glass, 2 × 1 block
  const [qty, setQty] = useState(1);
  // Vice weight (Light / Medium / Heavy); pre-picked from my last use of the same note
  const [viceWeight, setViceWeight] = useState('medium');
  const [weightTouched, setWeightTouched] = useState(false);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [datetime, setDatetime] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill for editing
  useEffect(() => {
    if (editEntry) {
      if (editEntry.type === 'steps') {
        setType('gym');
        setActivityMode('steps');
      } else if (editEntry.type === 'break') {
        setType('sleep');
        setRestMode('break');
      } else {
        setType(editEntry.type);
        setActivityMode('minutes');
      }
      const q = editEntry.qty && editEntry.qty > 1 ? editEntry.qty : 1;
      setQty(q);
      setViceWeight(editEntry.weight || 'medium');
      setWeightTouched(true);
      const each = editEntry.value / q;
      if (editEntry.type === 'water') setWaterSize(editEntry.container || (each >= 750 ? 'bottle' : 'glass'));
      setValue(String(Math.round(each * 100) / 100));
      setNote(editEntry.note || '');
      // Convert ISO to datetime-local format
      const d = new Date(editEntry.timestamp);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDatetime(local);
    } else {
      resetForm();
    }
  }, [editEntry]);

  function resetForm() {
    setValue('');
    setQty(1);
    setNote('');
    setSubmitted(false);
    // Default datetime to now in local timezone
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDatetime(local);
  }

  // Reset datetime on mount
  useEffect(() => {
    if (!editEntry) resetForm();
  }, []);

  const isSteps = type === 'gym' && activityMode === 'steps';
  const isBreak = type === 'sleep' && restMode === 'break';
  const currentType = isSteps ? STEPS_TYPE : isBreak ? BREAK_TYPE : TYPES.find((t) => t.value === type);

  // e.g. "= 30 min", "= 2.5 L", "= 3 blocks"
  function qtySummary() {
    if (qty <= 1) return '';
    if (type === 'water') {
      const ml = (WATER_SIZES.find((w) => w.key === waterSize) || WATER_SIZES[0]).ml;
      return `= ${(ml * qty / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;
    }
    if (type === 'vices') return `= ${qty}`;
    const v = parseFloat(value);
    if (isNaN(v)) return '';
    return `= ${(Math.round(v * qty * 100) / 100).toLocaleString()} ${currentType.unit}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    let numValue = parseFloat(value);
    if (type === 'water') numValue = (WATER_SIZES.find((w) => w.key === waterSize) || WATER_SIZES[0]).ml;
    if (type === 'vices') {
      if (!note.trim()) return; // the note is the entry
      numValue = 1;
    }
    if (isNaN(numValue) || numValue <= 0) return;

    const times = Math.max(1, Math.min(50, parseInt(qty, 10) || 1));
    const entry = {
      type: currentType.value,
      value: Math.round(numValue * times * 100) / 100,
      qty: times,
      ...(type === 'vices' ? { weight: viceWeight } : {}),
      ...(type === 'water' ? { container: waterSize } : {}),
      unit: currentType.unit,
      note: note.trim(),
      timestamp: new Date(datetime).toISOString(),
    };

    if (editEntry) {
      entry.id = editEntry.id;
    }

    if (type === 'vices') rememberWeight(entry.note, viceWeight);
    onSubmit(entry);
    setSubmitted(true);

    // Show success briefly, then reset
    setTimeout(() => {
      resetForm();
      setType(initialType);
      setActivityMode('minutes');
      setRestMode('sleep');
      setViceWeight('medium');
      setWeightTouched(false);
    }, 1200);
  }



  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', px: 2, py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontSize: '1.2rem' }}>
          {editEntry ? 'Edit Entry' : 'Log Entry'}
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close" id="log-close-button" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Card>
        <CardContent component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Type selector */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Type
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, v) => v && setType(v)}
              fullWidth
              size="small"
              aria-label="Entry type"
              sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1, '& .MuiToggleButton-root': { borderRadius: '10px !important', border: `1px solid ${tokens.borderViolet} !important`, m: 0 } }}
            >
              {TYPES.map((t) => (
                <ToggleButton
                  key={t.value}
                  value={t.value}
                  id={`log-type-${t.value}`}
                  sx={{
                    gap: 0.5,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.08em',
                    fontFamily: '"Space Grotesk", sans-serif',
                    '&.Mui-selected': {
                      backgroundColor: tokens.accentDim15,
                      color: tokens.violetBright,
                      borderColor: tokens.accentBorder40,
                    },
                  }}
                >
                  {React.createElement(t.icon, { fontSize: 'small' })}
                  {t.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Activity: minutes or steps */}
          {type === 'gym' && (
            <ToggleButtonGroup
              value={activityMode}
              exclusive
              onChange={(_, v) => { if (v) { setActivityMode(v); setValue(''); } }}
              size="small"
              aria-label="Activity measure"
              id="activity-mode"
              sx={{ alignSelf: 'flex-start', '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 2, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
            >
              <ToggleButton value="minutes" id="activity-mode-minutes">Minutes</ToggleButton>
              <ToggleButton value="steps" id="activity-mode-steps">Steps</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Rest: sleep or a break */}
          {type === 'sleep' && (
            <ToggleButtonGroup
              value={restMode}
              exclusive
              onChange={(_, v) => { if (v) { setRestMode(v); setValue(v === 'break' ? BREAK_TYPE.defaultValue : ''); } }}
              size="small"
              aria-label="Rest type"
              id="rest-mode"
              sx={{ alignSelf: 'flex-start', '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 2, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
            >
              <ToggleButton value="sleep" id="rest-mode-sleep">Sleep</ToggleButton>
              <ToggleButton value="break" id="rest-mode-break">Break</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* H2O: glass or bottle */}
          {type === 'water' && (
            <ToggleButtonGroup
              value={waterSize}
              exclusive
              onChange={(_, v) => v && setWaterSize(v)}
              fullWidth
              aria-label="Glass or bottle"
              id="water-size"
              sx={{ '& .MuiToggleButton-root': { py: 1.5, gap: 1, fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.85rem', letterSpacing: '0.08em', '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
            >
              <ToggleButton value="glass" id="water-glass"><LocalDrinkIcon fontSize="small" />Glass</ToggleButton>
              <ToggleButton value="bottle" id="water-bottle"><WaterBottleIcon fontSize="small" />Bottle</ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Value input (not for H2O or Vices) */}
          {!NO_VALUE_TYPES.includes(type) && (
          <TextField
            label={`Value (${currentType.unit})`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={currentType.placeholder}
            required
            fullWidth
            inputProps={{ min: 0, step: currentType.step }}
            helperText={type === 'productivity' && value ? `= ${(parseFloat(value) * qty * 1.5 || 0).toLocaleString()} hours` : undefined}
            id="log-value-input"
          />
          )}

          {/* Quantity: log repeats in one entry */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} id="log-qty">
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 44 }}>Times</Typography>
            <IconButton onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Fewer" id="log-qty-minus"
              sx={{ border: `1px solid ${tokens.borderViolet}`, borderRadius: '10px', width: 36, height: 36, color: 'primary.light' }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.1rem', minWidth: 36, textAlign: 'center' }} id="log-qty-value">
              × {qty}
            </Typography>
            <IconButton onClick={() => setQty((q) => Math.min(50, q + 1))} aria-label="More" id="log-qty-plus"
              sx={{ border: `1px solid ${tokens.borderViolet}`, borderRadius: '10px', width: 36, height: 36, color: 'primary.light' }}>
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'primary.light', ml: 'auto' }} id="log-qty-total">
              {qtySummary()}
            </Typography>
          </Box>

          {/* Note input (most useful for food) */}
          <TextField
            label={type === 'vices' ? 'What was it?' : 'Note (optional)'}
            required={type === 'vices'}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (type === 'vices' && !weightTouched) {
                const w = rememberedWeight(e.target.value);
                if (w) setViceWeight(w);
              }
            }}
            placeholder={type === 'food' ? 'e.g. Grilled chicken salad' : type === 'vices' ? 'e.g. Beer at lunch' : 'Optional note'}
            fullWidth
            id="log-note-input"
          />

          {/* Vice weight */}
          {type === 'vices' && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Weight</Typography>
              <ToggleButtonGroup
                value={viceWeight}
                exclusive
                onChange={(_, v) => { if (v) { setViceWeight(v); setWeightTouched(true); } }}
                fullWidth
                size="small"
                aria-label="Vice weight"
                id="vice-weight"
                sx={{ '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
              >
                {VICE_WEIGHTS.map((w) => (
                  <ToggleButton key={w.key} value={w.key} id={`vice-weight-${w.key}`}>{w.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Date/time picker */}
          <TextField
            label="Date & time"
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            fullWidth
            id="log-datetime-input"
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={submitted}
              startIcon={submitted ? <CheckIcon /> : null}
              id="log-submit-button"
            >
              {submitted ? 'Logged!' : editEntry ? 'Save changes' : 'Log entry'}
            </Button>
            {editEntry && onCancel && (
              <Button
                variant="outlined"
                size="large"
                onClick={onCancel}
                id="log-cancel-button"
              >
                Cancel
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
