import React, { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import MetricCard from './MetricCard';
import MovedWorkoutDialog from './MovedWorkoutDialog';
import { tokens } from '../theme';
import QUOTES from '../data/quotes';
import { LOG_TYPES } from '../data/logTypes';
import useMode from '../hooks/useMode';
import { dayAnchors } from '../lib/shiftTime';
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

export default function Dashboard({ entries, onQuickAdd, onQuickWater, onQuickGym, onNavigatePlanner, planner }) {
  const todayStr = planner.todayStr;
  const todayPlanned = planner.todayPlanned;
  const demoToday = planner.demoToday;

  const metrics = useMemo(() => {
    return METRIC_TYPES.map((type) => {
      const typeEntries = entries.filter((e) => e.type === type);
      const todayEntries = typeEntries.filter(
        (e) => new Date(e.timestamp).toLocaleDateString('en-CA') === todayStr
      );
      const todayTotal = todayEntries.reduce((sum, e) => sum + e.value, 0);
      const byDay = {};
      typeEntries.forEach((e) => {
        const day = new Date(e.timestamp).toLocaleDateString('en-CA');
        byDay[day] = (byDay[day] || 0) + e.value;
      });
      const trendData = [];
      const baseDate = demoToday ? new Date(demoToday + 'T12:00:00') : new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        const dayStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendData.push({
          date: label,
          value: byDay[dayStr] ? Math.round(byDay[dayStr] * 10) / 10 : 0,
        });
      }
      return {
        type,
        todayTotal: Math.round(todayTotal * 10) / 10,
        trendData,
      };
    });
  }, [entries, todayStr, demoToday]);

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
  // App-wide mode (HQ / MWD, days / nights)
  const { mode, setMode } = useMode();
  const anchors = dayAnchors(mode);


  const stepsToday = useMemo(() => entries
    .filter((e) => e.type === 'steps' && new Date(e.timestamp).toLocaleDateString('en-CA') === todayStr)
    .reduce((sum, e) => sum + e.value, 0), [entries, todayStr]);

  const isDone = todayPlanned?.done;
  const isMissed = todayPlanned?.status === 'missed';
  const isPending = todayPlanned?.status === 'pending' && !isDone;

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

      {/* Today's planned workout card */}
      {todayPlanned && (
        <Card id="dashboard-planned-workout" sx={{ mb: 3, borderColor: isPending ? tokens.accentBorder40 : tokens.borderViolet }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <FitnessCenterIcon sx={{ color: 'primary.light', fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.65rem', fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                Today's Workout
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                {todayPlanned.workout?.name}
              </Typography>
              {todayPlanned.is_moved && todayPlanned.moved_from_date && (
                <Typography sx={{ fontSize: '0.7rem', color: tokens.violetBright, mt: 0.25 }}>
                  Rescheduled from {planner.formatDate(todayPlanned.moved_from_date)}
                </Typography>
              )}
            </Box>
            {isDone && (
              <Chip icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Done" size="small"
                sx={{ fontSize: '0.7rem', color: '#4ADE80', border: '1px solid', borderColor: 'rgba(74,222,128,0.3)', backgroundColor: 'rgba(74,222,128,0.08)' }} />
            )}
            {isPending && (
              <Button size="small" variant="outlined" onClick={onQuickGym} id="dashboard-checkin-button" sx={{ fontSize: '0.7rem' }}>
                Check in
              </Button>
            )}
            {isMissed && (
              <Chip icon={<EventBusyIcon sx={{ fontSize: 14 }} />} label="Missed" size="small"
                sx={{ fontSize: '0.7rem', color: '#FBBF24', border: '1px solid', borderColor: 'rgba(251,191,36,0.3)', backgroundColor: 'rgba(251,191,36,0.08)' }} />
            )}
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

      {/* Metric cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {metrics.map((m) => (
          <Box key={m.type} sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 11px)', md: '1 1 calc(33.333% - 11px)' } }}>
            <MetricCard type={m.type} todayTotal={m.todayTotal} trendData={m.trendData} onQuickAdd={() => onQuickAdd(m.type)}
              extra={m.type === 'gym' && stepsToday > 0 ? `${stepsToday.toLocaleString()} steps` : null} />
          </Box>
        ))}
      </Box>

      <MovedWorkoutDialog planner={planner} />
    </Box>
  );
}
