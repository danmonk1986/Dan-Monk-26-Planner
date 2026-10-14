import React, { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import AddIcon from '@mui/icons-material/Add';
import FlagIcon from '@mui/icons-material/Flag';
import GridViewIcon from '@mui/icons-material/GridView';
import ChecklistIcon from '@mui/icons-material/Checklist';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MetricCard from './MetricCard';
import NonNegotiables from './NonNegotiables';
import { tokens } from '../theme';
import QUOTES from '../data/quotes';
import { LOG_TYPES } from '../data/logTypes';
import useMode from '../hooks/useMode';
import { dayAnchors } from '../lib/shiftTime';
import { routineDayKey } from '../data/nonNegotiables';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightIcon from '@mui/icons-material/Nightlight';

const MY_QUOTES_KEY = 'monk.quotes';

function loadMyQuotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(MY_QUOTES_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((q) => q && typeof q.text === 'string') : [];
  } catch { return []; }
}

function pickRandom(list, current) {
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  let q;
  do { q = list[Math.floor(Math.random() * list.length)]; } while (q === current);
  return q;
}

// Live date + time in Mountain Time (Calgary), refreshed every 15 seconds.
function useMountainClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  const tz = 'America/Edmonton';
  const date = now.toLocaleDateString('en-CA', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  return { date, time };
}

const METRIC_TYPES = LOG_TYPES.map((t) => t.value);

export default function Dashboard({ entries, onQuickAdd }) {

  // App-wide mode (HQ / MWD, days / nights)
  const { mode, setMode } = useMode();
  // Log cards use the real routine day (4 AM to 4 AM, flips on nights),
  // the same day the Non-Negotiables use; not the Testing tab's demo date.
  const todayStr = routineDayKey(mode);
  const entryDay = (e) => routineDayKey(mode, new Date(e.timestamp));

  const metrics = useMemo(() => {
    return METRIC_TYPES.map((type) => {
      const typeEntries = entries.filter((e) => e.type === type);
      const todayEntries = typeEntries
        .filter((e) => entryDay(e) === todayStr)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const todayTotal = todayEntries.reduce((sum, e) => sum + e.value, 0);
      const byDay = {};
      typeEntries.forEach((e) => {
        const day = entryDay(e);
        byDay[day] = (byDay[day] || 0) + e.value;
      });
      const trendData = [];
      const [ty, tm, td] = todayStr.split('-').map(Number);
      for (let i = 13; i >= 0; i--) {
        const d = new Date(ty, tm - 1, td - i, 12);
        const dayStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendData.push({
          date: label,
          value: byDay[dayStr] ? Math.round(byDay[dayStr] * 10) / 10 : 0,
        });
      }
      return {
        type,
        todayTotal: Math.round(todayTotal * 100) / 100,
        trendData,
        todayEntries,
      };
    });
  }, [entries, todayStr, mode]);

  const clock = useMountainClock();
  // Quotes: built-in list + ones added on this device. One random per visit.
  const [myQuotes, setMyQuotes] = useState(loadMyQuotes);
  const allQuotes = useMemo(() => [...QUOTES, ...myQuotes], [myQuotes]);
  const [quote, setQuote] = useState(() => pickRandom([...QUOTES, ...loadMyQuotes()], null));
  const handleShuffle = () => setQuote((cur) => pickRandom(allQuotes, cur));
  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const handleSaveQuote = () => {
    const q = { text: newText.trim(), author: newAuthor.trim() };
    if (!q.text) return;
    const next = [...myQuotes, q];
    setMyQuotes(next);
    try { localStorage.setItem(MY_QUOTES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setQuote(q);
    setNewText(''); setNewAuthor(''); setAddOpen(false);
  };
  // Dashboard view: Non-Negotiables or the log cards (remembered on this device)
  const [dashView, setDashView] = useState(() => {
    try { return localStorage.getItem('monk.dashView') === 'log' ? 'log' : 'nn'; } catch { return 'nn'; }
  });
  const toggleView = () => {
    const next = dashView === 'nn' ? 'log' : 'nn';
    setDashView(next);
    try { localStorage.setItem('monk.dashView', next); } catch { /* ignore */ }
  };

  const anchors = dayAnchors(mode);


  const stepsToday = useMemo(() => entries
    .filter((e) => e.type === 'steps' && entryDay(e) === todayStr)
    .reduce((sum, e) => sum + e.value, 0), [entries, todayStr, mode]);
  // Breaks logged under Rest (count uses the × quantity)
  const breaksToday = useMemo(() => entries
    .filter((e) => e.type === 'break' && entryDay(e) === todayStr)
    .reduce((sum, e) => sum + (e.qty || 1), 0), [entries, todayStr, mode]);


  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Date + time (Mountain Time) on one line */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5 }} id="dashboard-clock">
        <Typography variant="h5" sx={{ fontSize: '1.2rem' }}>
          {clock.date}
        </Typography>
        <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.08em', color: 'primary.light' }}>
          {clock.time}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ width: '100%', letterSpacing: '0.04em' }} id="mode-anchors">
          {mode.place === 'mwd' ? `Shift ${mode.shift === 'nights' ? '6 PM – 6 AM' : '6 AM – 6 PM'} · ` : ''}Wake {anchors.wake} · Bed by {anchors.bed}
        </Typography>
      </Box>

      {/* Quote: frosted panel so it stays legible over the background */}
      {quote && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }} id="dashboard-quote">
          <Box
            sx={{
              position: 'relative',
              maxWidth: 620,
              width: '100%',
              px: { xs: 3, sm: 5 },
              py: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              backgroundColor: 'rgba(10,10,20,0.72)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${tokens.borderViolet}`,
              boxShadow: `0 0 32px rgba(${tokens.accentRGB},0.18)`,
              textAlign: 'center',
            }}
          >
            {/* Oversized teal quote mark */}
            <Typography aria-hidden="true" sx={{ position: 'absolute', top: -6, left: 14, fontFamily: '"Space Grotesk", sans-serif', fontSize: '4rem', lineHeight: 1, color: 'primary.light', opacity: 0.9 }}>
              “
            </Typography>
            <Typography
              component="p"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.45,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'pre-line',
                color: '#F5F5FA',
                textShadow: `0 0 18px rgba(${tokens.accentBrightRGB},0.25)`,
              }}
            >
              {quote.text}
            </Typography>
            {quote.author && (
              <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'primary.main', mt: 1.5 }}>
                — {quote.author}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Where I am: HQ / MWD (days / nights) */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }} id="mode-switch">
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={mode.place}
            exclusive
            onChange={(_, v) => v && setMode({ place: v })}
            size="small"
            aria-label="Where I am: HQ or MWD"
            id="mode-place"
            sx={{ '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 2, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
          >
            <ToggleButton value="hq" id="goals-mode-hq">HQ</ToggleButton>
            <ToggleButton value="mwd" id="goals-mode-mwd">MWD</ToggleButton>
          </ToggleButtonGroup>
          {mode.place === 'mwd' && (
            <ToggleButtonGroup
              value={mode.shift}
              exclusive
              onChange={(_, v) => v && setMode({ shift: v })}
              size="small"
              aria-label="Shift: days or nights"
              id="mode-shift"
              sx={{ '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 1.5, gap: 0.5, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
            >
              <ToggleButton value="days" id="mode-shift-days"><WbSunnyIcon sx={{ fontSize: 16 }} />Days</ToggleButton>
              <ToggleButton value="nights" id="mode-shift-nights"><NightlightIcon sx={{ fontSize: 16 }} />Nights</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Flip between the Non-Negotiables and the log cards */}
          <Tooltip title={dashView === 'nn' ? 'Show log' : 'Show Non-Negotiables'}>
            <IconButton
              onClick={toggleView}
              aria-label={dashView === 'nn' ? 'Show log' : 'Show Non-Negotiables'}
              id="dashboard-view-toggle"
              sx={{ color: 'primary.light', border: `1px solid ${tokens.borderViolet}`, borderRadius: '10px', width: 34, height: 34, '&:hover': { backgroundColor: tokens.accentDim12, borderColor: 'primary.main' } }}
            >
              {dashView === 'nn' ? <GridViewIcon fontSize="small" /> : <ChecklistIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {/* Placeholder: Daily Goals get fleshed out next */}
          <Button variant="outlined" size="small" startIcon={<FlagIcon />} id="daily-goals-button" sx={{ fontSize: '0.75rem' }}>
            Daily Goals
          </Button>
          <ButtonGroup variant="outlined" size="small" aria-label="Inspiration">
            <Button startIcon={<AddIcon />} onClick={() => setAddOpen(true)} id="inspiration-add-button" sx={{ fontSize: '0.75rem' }}>
              Inspiration
            </Button>
            <Button onClick={handleShuffle} disabled={allQuotes.length < 2} aria-label="Shuffle quote" id="inspiration-shuffle-button">
              <ShuffleIcon fontSize="small" />
            </Button>
          </ButtonGroup>
        </Box>
      </Box>

      {/* Daily baseline (or the log cards, via the view toggle) */}
      {dashView === 'nn' && <NonNegotiables entries={entries} onLog={(p) => onQuickAdd(p.type, p)} />}


      {/* Add a quote */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: '1rem' }}>Add a quote</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="Quote" value={newText} onChange={(e) => setNewText(e.target.value)} multiline minRows={2} autoFocus id="new-quote-text" />
          <TextField label="Author" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} id="new-quote-author" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveQuote} disabled={!newText.trim()} id="new-quote-save">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Metric cards (log view) */}
      {dashView === 'log' && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }} id="dashboard-log-view">
        {metrics.map((m) => (
          <Box key={m.type} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 11px)', md: '1 1 calc(33.333% - 11px)' } }}>
            <MetricCard type={m.type} todayTotal={m.todayTotal} trendData={m.trendData} todayEntries={m.todayEntries} onQuickAdd={() => onQuickAdd(m.type)}
              extra={m.type === 'gym' && stepsToday > 0 ? `${stepsToday.toLocaleString()} steps`
                : m.type === 'sleep' && breaksToday > 0 ? `${breaksToday} break${breaksToday > 1 ? 's' : ''}` : null} />
          </Box>
        ))}
      </Box>
      )}

    </Box>
  );
}
