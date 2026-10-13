import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import BiotechIcon from '@mui/icons-material/Biotech';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DatasetIcon from '@mui/icons-material/Dataset';
import RefreshIcon from '@mui/icons-material/Refresh';
import useMediaQuery from '@mui/material/useMediaQuery';
import Nav from './components/Nav';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import History from './components/History';
import WeeklySummary from './components/WeeklySummary';
import Planner from './components/Planner';
import useEntries from './hooks/useEntries';
import usePlanner from './hooks/usePlanner';
import brand from './brand';

export default function App() {
  const { entries, add, update, remove, clearAll, removeByNote, loadSampleData } = useEntries();
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

  const demoToday = planner.demoToday;
  const groupAssignment = planner.settings?.group_assignment || 'adaptive';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: isMobile ? '72px' : 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Nav view={view} onChangeView={setView} onOpenTesting={() => setTestingOpen(true)} />

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
          <BiotechIcon sx={{ color: '#FBBF24' }} />
          Testing
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {/* Planner testing controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
              Simulate a different today to test missed workouts, auto-rescheduling, and week transitions. Check-ins are timestamped at noon on the simulated date.
            </Typography>

            {/* Date picker */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                Demo today: {demoToday ? planner.formatDate(demoToday) : 'real date'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  type="date"
                  size="small"
                  value={demoToday || ''}
                  onChange={handleDemoDateChange}
                  id="demo-date-picker"
                  sx={{ fontSize: '0.75rem', '& .MuiInputBase-input': { fontSize: '0.75rem', padding: '6px 8px' } }}
                />
                {demoToday && (
                  <Button size="small" variant="outlined" onClick={handleUseRealDate} id="use-real-date-button" sx={{ fontSize: '0.7rem' }}>
                    Use real date
                  </Button>
                )}
              </Box>
            </Box>

            {/* Group toggle */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 1 }}>
                Group assignment
              </Typography>
              <ToggleButtonGroup
                value={groupAssignment}
                exclusive
                onChange={handleGroupChange}
                size="small"
              >
                <ToggleButton value="adaptive" id="demo-group-adaptive" sx={{ fontSize: '0.7rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                  Adaptive
                </ToggleButton>
                <ToggleButton value="fixed" id="demo-group-fixed" sx={{ fontSize: '0.7rem', fontFamily: '"Space Grotesk", sans-serif' }}>
                  Fixed
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Reset planner */}
            <Box>
              {!confirmReset ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RefreshIcon />}
                  onClick={() => setConfirmReset(true)}
                  id="reset-planner-button"
                  sx={{ fontSize: '0.7rem' }}
                >
                  Reset planner
                </Button>
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
          </Box>

          <Divider />

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
            {brand.name} stores all data in your browser. Nothing is sent to a server.
          </Typography>

          {/* Reload sample data */}
          <Button
            variant="outlined"
            startIcon={<DatasetIcon />}
            onClick={() => { loadSampleData(); closeTesting(); }}
            id="reload-sample-data-button"
          >
            Reload sample data
          </Button>

          {/* Clear all data */}
          {!confirmClear ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setConfirmClear(true)}
              id="clear-data-button"
            >
              Clear all data
            </Button>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="error">
                This will permanently delete all your entries. Are you sure?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => { clearAll(); closeTesting(); }}
                  id="confirm-clear-button"
                >
                  Yes, clear all
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setConfirmClear(false)}
                  id="cancel-clear-button"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
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
