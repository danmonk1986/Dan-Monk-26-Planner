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
import { tokens } from '../theme';
import { LOG_TYPES, STEPS_TYPE } from '../data/logTypes';

const TYPES = LOG_TYPES;

const WATER_PRESETS = [250, 350, 500, 750];

/**
 * Form to add or edit a health entry.
 * Props:
 *   onSubmit    – called with the entry data ({ type, value, unit, note, timestamp })
 *   editEntry   – if provided, the form pre-fills for editing
 *   onCancel    – called when editing is cancelled
 */
export default function LogForm({ onSubmit, editEntry = null, onCancel, initialType = 'food' }) {
  const [type, setType] = useState(initialType);
  // Activity can be logged as minutes or steps
  const [activityMode, setActivityMode] = useState('minutes');
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
      } else {
        setType(editEntry.type);
        setActivityMode('minutes');
      }
      setValue(String(editEntry.value));
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
  const currentType = isSteps ? STEPS_TYPE : TYPES.find((t) => t.value === type);

  function handleSubmit(e) {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    const entry = {
      type: currentType.value,
      value: numValue,
      unit: currentType.unit,
      note: note.trim(),
      timestamp: new Date(datetime).toISOString(),
    };

    if (editEntry) {
      entry.id = editEntry.id;
    }

    onSubmit(entry);
    setSubmitted(true);

    // Show success briefly, then reset
    setTimeout(() => {
      resetForm();
      setType(initialType);
      setActivityMode('minutes');
    }, 1200);
  }

  function handleWaterPreset(amount) {
    setType('water');
    setValue(String(amount));
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontSize: '1.2rem' }}>
        {editEntry ? 'Edit Entry' : 'Log Entry'}
      </Typography>

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

          {/* Water quick presets */}
          {type === 'water' && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Quick presets
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {WATER_PRESETS.map((amount) => (
                  <Chip
                    key={amount}
                    label={`${amount} ml`}
                    onClick={() => handleWaterPreset(amount)}
                    variant={value === String(amount) ? 'filled' : 'outlined'}
                    color="primary"
                    sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}
                    id={`water-preset-${amount}`}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Value input */}
          <TextField
            label={`Value (${currentType.unit})`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={currentType.placeholder}
            required
            fullWidth
            inputProps={{ min: 0, step: currentType.step }}
            helperText={type === 'productivity' && value ? `= ${(parseFloat(value) * 1.5 || 0).toLocaleString()} hours` : undefined}
            id="log-value-input"
          />

          {/* Note input (most useful for food) */}
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={type === 'food' ? 'e.g. Grilled chicken salad' : 'Optional note'}
            fullWidth
            id="log-note-input"
          />

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
