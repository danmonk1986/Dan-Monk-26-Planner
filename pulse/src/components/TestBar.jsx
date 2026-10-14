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
        gap: 1.5,
        px: 2,
        py: 1,
        mx: { xs: 2, sm: 3 },
        mt: 2,
        border: '1px dashed',
        borderColor: tokens.accentBorder40 || tokens.borderViolet,
        borderRadius: 2,
        backgroundColor: tokens.accentDim08,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <BiotechIcon sx={{ fontSize: 18, color: tokens.violetBright }} />
        <Typography sx={{ fontSize: '0.7rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'text.secondary' }}>
          Testing
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small" onClick={onPrevDay} aria-label="Previous day" id="test-bar-prev-day">
          <ChevronLeftIcon />
        </IconButton>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 104, textAlign: 'center' }}>
          {dateLabel}
        </Typography>
        <IconButton size="small" onClick={onNextDay} aria-label="Next day" id="test-bar-next-day">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={group}
        onChange={onGroupChange}
        aria-label="Group"
        id="test-bar-group"
      >
        <ToggleButton value="adaptive" sx={{ fontSize: '0.65rem', px: 1.25, py: 0.25 }}>Adaptive</ToggleButton>
        <ToggleButton value="fixed" sx={{ fontSize: '0.65rem', px: 1.25, py: 0.25 }}>Fixed</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ flex: 1 }} />

      <Button size="small" startIcon={<TuneIcon />} onClick={onOpenTesting} id="test-bar-more" sx={{ fontSize: '0.7rem' }}>
        More
      </Button>
    </Box>
  );
}
