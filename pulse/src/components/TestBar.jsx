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
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import { tokens } from '../theme';

const ON_ACCENT = '#FFFFFF';

const ghostBtn = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: ON_ACCENT,
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
  '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' },
};

const solidBtn = {
  fontSize: '0.75rem',
  fontWeight: 700,
  backgroundColor: ON_ACCENT,
  color: tokens.violet,
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.85)' },
};

const toggleSx = {
  fontSize: '0.7rem',
  fontWeight: 700,
  px: 1.5,
  py: 0.4,
  color: ON_ACCENT,
  borderColor: 'rgba(255,255,255,0.6)',
  '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: ON_ACCENT, color: tokens.violet },
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
};

/**
 * Testing strip on the Workout Planner (prototype only — remove with the
 * Testing tab). Condensed until "Start test"; then shows the guided script.
 */
export default function TestBar({
  active, onStart, onEnd, onReset,
  dateLabel, onPrevDay, onNextDay, group, onGroupChange,
  test, testIndex, testCount, onPrevTest, onNextTest, onRedoTest,
}) {
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

      {!active && (
        <>
          <Typography sx={{ fontSize: '0.85rem', color: ON_ACCENT, opacity: 0.9 }}>
            {testCount} guided tests of the planner's rules.
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<RocketLaunchIcon />} onClick={onStart} id="test-bar-start" sx={solidBtn}>
            Start test
          </Button>
          <Button size="small" startIcon={<RefreshIcon />} onClick={onReset} id="test-bar-reset" sx={ghostBtn}>
            Reset planner
          </Button>
        </>
      )}

      {active && (
        <>
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

          <Button size="small" startIcon={<RefreshIcon />} onClick={onReset} id="test-bar-reset" sx={ghostBtn}>
            Reset planner
          </Button>
          <Button size="small" startIcon={<CloseIcon />} onClick={onEnd} id="test-bar-end" sx={ghostBtn}>
            End test
          </Button>

          {test && (
            <Box
              id="test-bar-script"
              sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.35)', pt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}
            >
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: ON_ACCENT }}>
                Test {testIndex + 1} of {testCount} · {test.id !== 'FIXED' ? `${test.id} ` : ''}{test.name}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: ON_ACCENT, lineHeight: 1.45 }}>
                <Box component="span" sx={{ fontWeight: 700 }}>Do: </Box>{test.doText}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: ON_ACCENT, lineHeight: 1.45 }}>
                <Box component="span" sx={{ fontWeight: 700 }}>Expect: </Box>{test.expect}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                <Button size="small" startIcon={<ReplayIcon />} onClick={onRedoTest} id="test-bar-redo" sx={ghostBtn}>
                  Redo test
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button size="small" startIcon={<ChevronLeftIcon />} onClick={onPrevTest} disabled={testIndex === 0} id="test-bar-prev-test" sx={ghostBtn}>
                  Prev
                </Button>
                <Button variant="contained" endIcon={<ChevronRightIcon />} onClick={onNextTest} disabled={testIndex === testCount - 1} id="test-bar-next-test"
                  sx={{ ...solidBtn, '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' } }}>
                  Next test
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
