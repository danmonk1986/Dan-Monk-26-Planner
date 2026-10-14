import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import BiotechIcon from '@mui/icons-material/Biotech';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import { tokens } from '../theme';

const ON_ACCENT = '#FFFFFF';

const toggleSx = {
  fontSize: '0.7rem',
  fontWeight: 700,
  px: 1.5,
  py: 0.4,
  color: ON_ACCENT,
  borderColor: 'rgba(255,255,255,0.6)',
  '&.Mui-selected, &.Mui-selected:hover': {
    backgroundColor: ON_ACCENT,
    color: tokens.violet,
  },
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
};

/**
 * Testing strip shown on the Dashboard and Workout Planner while a demo
 * date is active. Prototype-only: remove together with the Testing tab.
 */
export default function TestBar({ dateLabel, onPrevDay, onNextDay, group, onGroupChange, onOpenTesting }) {
  return (
    <Box
      id="test-bar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        px: 2.5,
        py: 1.25,
        mx: { xs: 2, sm: 3 },
        mt: 2,
        borderRadius: 2,
        backgroundColor: tokens.violet,
        color: ON_ACCENT,
        boxShadow: `0 0 18px ${tokens.accentBorder40}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BiotechIcon sx={{ fontSize: 26, color: ON_ACCENT }} />
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.14em', color: ON_ACCENT }}>
          Testing
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small" onClick={onPrevDay} aria-label="Previous day" id="test-bar-prev-day" sx={{ color: ON_ACCENT }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, minWidth: 110, textAlign: 'center', color: ON_ACCENT }}>
          {dateLabel}
        </Typography>
        <IconButton size="small" onClick={onNextDay} aria-label="Next day" id="test-bar-next-day" sx={{ color: ON_ACCENT }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <ToggleButtonGroup size="small" exclusive value={group} onChange={onGroupChange} aria-label="Group" id="test-bar-group">
        <ToggleButton value="adaptive" sx={toggleSx}>Adaptive</ToggleButton>
        <ToggleButton value="fixed" sx={toggleSx}>Fixed</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ flex: 1 }} />

      <Button
        size="small"
        startIcon={<TuneIcon />}
        onClick={onOpenTesting}
        id="test-bar-more"
        sx={{ fontSize: '0.75rem', fontWeight: 700, color: ON_ACCENT, '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}
      >
        More
      </Button>
    </Box>
  );
}
