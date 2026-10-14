import React, { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useMediaQuery from '@mui/material/useMediaQuery';
import Nav from './components/Nav';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import History from './components/History';
import WeeklySummary from './components/WeeklySummary';
import Planner from './components/Planner';
import useEntries from './hooks/useEntries';
import usePlanner from './hooks/usePlanner';
import { tokens } from './theme';
import brand from './brand';

const sectionHeading = {
  fontSize: '0.7rem',
  fontFamily: '"Space Grotesk", sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'text.secondary',
  mb: 1,
};

export default function App() {
  const { entries, add, update, remove, clearAll, removeByNote, removeGymBetween } = useEntries();
  const planner = usePlanner(entries);
  const [view, setView] = useState(0);
  const [editEntry, setEditEntry] = useState(null);
  const [testingOpen, setTestingOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleLogSubmit = useCallback((entry) => {
    if (entry.id) {
      update(entry.id, entry);
    } else {
      add(entry);
    }
    setEditEntry(null);
  }, [add, update]);

  const handleQuickAdd = useCallback(() => {
    setEditEntry(null);
    setView(1);
  }, []);

  const handleQuickWater = useCallback(() => {
    add({
      type: 'water',
      value: 250,
      unit: 'ml',
      note: '',
      timestamp: new Date().toISOString(),
    });
  }, [add]);

  const handleQuickGym = useCallback(() => {
    add({
      type: 'gym',
      value: 60,
      unit: 'minutes',
      note: 'Gym check-in',
      timestamp: new Date().toISOString(),
    });
  }, [add]);

  const handleEdit = useCallback((entry) => {
    setEditEntry(entry);
    setView(1);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditEntry(null);
  }, []);

  // ── Testing dialog handlers ──────────────────────────────────
  const handleDemoDateChange = useCallback((e) => {
    planner.setDemoToday(e.target.value || null);
  }, [planner]);

  const handleUseRealDate = useCallback(() => {
    planner.setDemoToday(null);
  }, [planner]);

  const handleGroupChange = useCallback((_, val) => {
    if (val) planner.setGroup(val);
  }, [planner]);

  const handleResetPlanner = useCallback(() => {
    removeByNote('Planner check-in');
    planner.resetPlanner();
    setConfirmReset(false);
  }, [planner, removeByNote]);

  const closeTesting = useCallback(() => {
    setTestingOpen(false);
    setConfirmClear(false);
    setConfirmReset(false);
  }, []);

  const handleLaunchTest = useCallback(() => {
    removeByNote('Planner check-in');
    // Clear any gym check-ins (incl. sample data) in the test week so it starts clean.
    removeGymBetween('2026-10-19', '2026-10-25');
    planner.launchTest('2026-10-19');
    setView(4);
    closeTesting();
  }, [planner, removeByNote, removeGymBetween, closeTesting]);

  const demoToday = planner.demoToday;
  const groupAssignment = planner.settings?.group_assignment || 'adaptive';

  // Format "Today: Tue, Oct 20" for the current demo date
  const todayLabel = useMemo(() => {
    const ref = demoToday ? new Date(demoToday + 'T12:00:00') : new Date();
    return ref.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [demoToday]);

  // Shift the demo date by ±1 day
  const shiftDemoDate = useCallback((delta) => {
    const ref = demoToday ? new Date(demoToday + 'T12:00:00') : new Date();
    ref.setDate(ref.getDate() + delta);
    planner.setDemoToday(ref.toLocaleDateString('en-CA'));
  }, [demoToday, planner]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: isMobile ? '72px' : 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Nav view={view} onChangeView={setView} onOpenTesting={() => { setView(4); setTestingOpen(true); }} />

      {/* Main content */}
      <Box sx={{ flex: 1 }}>
        {view === 0 && (
          <Dashboard
            entries={entries}
            onQuickAdd={handleQuickAdd}
            onQuickWater={handleQuickWater}
            onQuickGym={handleQuickGym}
            onNavigatePlanner={() => setView(4)}
            planner={planner}
          />
        )}
        {view === 1 && (
          <LogForm
            onSubmit={handleLogSubmit}
            editEntry={editEntry}
            onCancel={editEntry ? handleCancelEdit : undefined}
          />
        )}
        {view === 2 && (
          <History
            entries={entries}
            onEdit={handleEdit}
            onDelete={remove}
          />
        )}
        {view === 3 && <WeeklySummary />}
        {view === 4 && (
          <Planner
            planner={planner}
            onAddEntry={add}
            onRemovePlannerCheckIns={() => removeByNote('Planner check-in')}
          />
        )}
      </Box>

      <Box component="footer" sx={{ py: 2, px: 3, textAlign: 'center', color: 'text.secondary', borderTop: 1, borderColor: 'divider', fontSize: '0.85rem' }}>
        {brand.name} example app for the book Practical Product Management by Guinevere Orvis.{' '}
        <Box component="a" href="https://github.com/gorvis/book-pm-management/blob/main/LICENSE" target="_blank" rel="noreferrer" sx={{ color: 'inherit', textDecoration: 'underline' }}>
          Read license.
        </Box>
      </Box>

      {/* Testing dialog */}
      <Dialog
        open={testingOpen}
        onClose={closeTesting}
        maxWidth="xs"
        fullWidth
        id="testing-dialog"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '1rem' }}>
          <BiotechIcon sx={{ color: tokens.violetBright }} />
          Testing
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {/* Intro */}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
            How to test: tap Launch test, set up a week, then use the date arrows to skip a day and watch the planner adapt. These tools are for testing only and are not part of the student app.
          </Typography>

          {/* Launch test — step one */}
          <Box>
            <Button
              variant="contained"
              startIcon={<RocketLaunchIcon />}
              onClick={handleLaunchTest}
              id="launch-test-button"
            >
              Launch test
            </Button>
          </Box>

          {/* ── Date section ── */}
          <Box>
            <Typography sx={sectionHeading}>Date</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
              Today: {todayLabel}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <IconButton size="small" onClick={() => shiftDemoDate(-1)} aria-label="Previous day" id="demo-prev-day">
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <TextField
                type="date"
                size="small"
                value={demoToday || ''}
                onChange={handleDemoDateChange}
                id="demo-date-picker"
                sx={{ fontSize: '0.75rem', flex: '1 1 auto', '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '6px 8px' } }}
              />
              <IconButton size="small" onClick={() => shiftDemoDate(1)} aria-label="Next day" id="demo-next-day">
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
            {demoToday && (
              <Button size="small" onClick={handleUseRealDate} id="use-real-date-button" sx={{ fontSize: '0.7rem', mt: 0.75, textTransform: 'none', color: 'text.secondary', minWidth: 0, p: 0, '&:hover': { backgroundColor: 'transparent', color: 'primary.light' } }}>
                Back to real date
              </Button>
            )}
          </Box>

          <Divider />

          {/* ── Group section ── */}
          <Box>
            <Typography sx={sectionHeading}>Group</Typography>
            <ToggleButtonGroup
              value={groupAssignment}
              exclusive
              onChange={handleGroupChange}
              size="small"
              sx={{ mb: 1 }}
            >
              <ToggleButton value="adaptive" id="demo-group-adaptive" sx={{ fontSize: '0.7rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                Adaptive
              </ToggleButton>
              <ToggleButton value="fixed" id="demo-group-fixed" sx={{ fontSize: '0.7rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                Fixed
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
              Adaptive moves missed workouts to the next available day. Fixed leaves them missed.
            </Typography>
          </Box>

          <Divider />

          {/* ── Start over section ── */}
          <Box>
            <Typography sx={sectionHeading}>Start over</Typography>
            {!confirmReset ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon />}
                  onClick={() => setConfirmReset(true)}
                  id="reset-planner-button"
                  sx={{ fontSize: '0.7rem', mb: 1 }}
                >
                  Reset planner
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                  Clears the plan and planner check-ins, then opens setup.
                </Typography>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="error" sx={{ fontSize: '0.75rem' }}>
                  This clears your plan and all planner check-ins. Are you sure?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" color="error" onClick={handleResetPlanner} id="confirm-reset-planner" sx={{ fontSize: '0.7rem' }}>
                    Yes, reset
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setConfirmReset(false)} id="cancel-reset-planner" sx={{ fontSize: '0.7rem' }}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Divider />

          {/* ── App data section ── */}
          <Box>
            <Typography sx={sectionHeading}>App data</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.5, mb: 1.5 }}>
              {brand.name} stores all data in your browser. Nothing is sent to a server.
            </Typography>

            {/* Clear all data */}
            {!confirmClear ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={() => setConfirmClear(true)}
                id="clear-data-button"
                sx={{ fontSize: '0.7rem' }}
              >
                Clear all data
              </Button>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" color="error" sx={{ fontSize: '0.75rem' }}>
                  This will permanently delete all your entries. Are you sure?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => { clearAll(); closeTesting(); }}
                    id="confirm-clear-button"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Yes, clear all
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setConfirmClear(false)}
                    id="cancel-clear-button"
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTesting}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
