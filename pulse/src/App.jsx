import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import useMediaQuery from '@mui/material/useMediaQuery';
import Nav from './components/Nav';
import CyberBackground from './components/CyberBackground';
import Dashboard from './components/Dashboard';
import LogForm from './components/LogForm';
import History from './components/History';
import WeeklySummary from './components/WeeklySummary';
import useEntries from './hooks/useEntries';
import brand from './brand';

/**
 * Views: 0 Dashboard · 1 Log form · 2 History · 3 Summary.
 * Log and History aren't menu tabs: Log opens from the Dashboard,
 * History from the Summary.
 */
export default function App() {
  const { entries, add, update, remove } = useEntries();
  const [view, setView] = useState(0);
  const [editEntry, setEditEntry] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleLogSubmit = useCallback((entry) => {
    if (entry.id) {
      update(entry.id, entry);
    } else {
      add(entry);
    }
    // Back to where the entry came from: edits -> History, new -> Dashboard
    // (short delay so the form's "saved" confirmation is seen first)
    const backTo = entry.id ? 2 : 0;
    setTimeout(() => setView(backTo), 900);
    setEditEntry(null);
  }, [add, update]);

  const [logType, setLogType] = useState('food');
  const [logPrefill, setLogPrefill] = useState(null); // e.g. { value: '10', qty: 3 }
  const handleQuickAdd = useCallback((type, prefill = null) => {
    setEditEntry(null);
    setLogType(type || 'food');
    setLogPrefill(prefill);
    setView(1);
  }, []);

  const handleEdit = useCallback((entry) => {
    setEditEntry(entry);
    setView(1);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditEntry(null);
    setView(2);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: isMobile ? '72px' : 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CyberBackground />
      <Nav view={view} onChangeView={setView} />

      {/* Main content */}
      <Box sx={{ flex: 1 }}>
        {view === 0 && <Dashboard entries={entries} onQuickAdd={handleQuickAdd} />}
        {view === 1 && (
          <LogForm
            key={editEntry ? editEntry.id : `${logType}-${logPrefill ? 'prefill' : 'blank'}`}
            initialType={logType}
            prefill={logPrefill}
            onSubmit={handleLogSubmit}
            editEntry={editEntry}
            onCancel={editEntry ? handleCancelEdit : undefined}
            onClose={() => { const back = editEntry ? 2 : 0; setEditEntry(null); setView(back); }}
          />
        )}
        {view === 2 && (
          <>
            <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, pt: 2 }}>
              <Button size="small" startIcon={<ChevronLeftIcon />} onClick={() => setView(3)} id="history-back-button">
                Back to Summary
              </Button>
            </Box>
            <History entries={entries} onEdit={handleEdit} onDelete={remove} />
          </>
        )}
        {view === 3 && <WeeklySummary entries={entries} onOpenHistory={() => setView(2)} />}
      </Box>

      <Box component="footer" sx={{ py: 2, px: 2, textAlign: 'center', color: 'text.secondary', borderTop: 1, borderColor: 'divider', fontSize: { xs: '0.75rem', md: '0.7rem' }, whiteSpace: { lg: 'nowrap' } }}>
        {brand.title
          ? `${brand.title}, reimagined from the Pulse app in Practical Product Management in the Age of AI by Guinevere Orvis. © 2026 Guinevere Orvis.`
          : `${brand.name} example app for the book Practical Product Management by Guinevere Orvis.`}{' '}
        <Box component="a" href="https://github.com/gorvis/book-pm-management/blob/main/LICENSE" target="_blank" rel="noreferrer" sx={{ color: 'inherit', textDecoration: 'underline' }}>
          Read license.
        </Box>
      </Box>
    </Box>
  );
}
