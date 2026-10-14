import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import HistoryIcon from '@mui/icons-material/History';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { tokens } from '../theme';

/**
 * WeeklySummary — a single read-only screen that shows a lapsing user their
 * week's progress with a kind, AI-phrased message.
 *
 * Design contract (from the PRD):
 *   - The APP computes every number and the trend. The AI only phrases the
 *     one-sentence message. That split is a hard rule, so all math lives in
 *     `deriveTrend()` and the sentence generator is never handed a number to
 *     invent.
 *   - Everything for this feature lives in this one file: the six test states,
 *     the trend logic, the message "AI", and the UI.
 *
 * On the "AI" seam: the Pulse project has no LLM SDK, no backend, and the lab
 * forbids new dependencies, so `generateMessage()` stands in for the model
 * call. It receives only the already-computed numbers/trend and returns copy
 * that follows the brand voice and guardrails — exactly the contract a real
 * prompt would have. Swapping in a live LLM call later means replacing the body
 * of `generateMessage()` and nothing else.
 */

// ---------------------------------------------------------------------------
// Test states — the six named situations this feature must handle, adapted
// from /artifacts/data/1week.md. `lastWeek: null` means "no prior week."
// `days` is the list of weekdays logged this week (display/context only; the
// count the app trusts is `thisWeek`).
// ---------------------------------------------------------------------------
const TEST_STATES = [
  {
    key: 'brandNew',
    label: 'Brand New User',
    thisWeek: 2,
    lastWeek: null,
    days: ['Mon', 'Thu'],
  },
  {
    key: 'flatZero',
    label: 'Flat Zero',
    thisWeek: 0,
    lastWeek: 0,
    days: [],
  },
  {
    key: 'improvement',
    label: 'Improvement',
    thisWeek: 5,
    lastWeek: 2,
    days: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat'],
  },
  {
    key: 'lapsed',
    label: 'Lapsed',
    thisWeek: 1,
    lastWeek: 3,
    days: ['Tue'],
  },
  {
    key: 'collapse',
    label: 'Collapse',
    thisWeek: 1,
    lastWeek: 7,
    days: ['Sun'],
  },
  {
    key: 'steady',
    label: 'Steady',
    thisWeek: 4,
    lastWeek: 4,
    days: ['Mon', 'Wed', 'Fri', 'Sun'],
  },
];

// ---------------------------------------------------------------------------
// Trend logic — computed by the APP, never by the AI.
// Returns one of: 'none' | 'steady' | 'up' | 'down'.
//   - no prior week (first week)   -> 'none' (omit the trend row)
//   - flat at zero (0 -> 0)        -> 'none' (nothing to show movement on)
//   - flat above zero (4 -> 4)     -> 'steady'
//   - otherwise                    -> 'up' or 'down'
// ---------------------------------------------------------------------------
function deriveTrend(thisWeek, lastWeek) {
  if (lastWeek === null || lastWeek === undefined) return 'none';
  if (thisWeek === 0 && lastWeek === 0) return 'none';
  if (thisWeek === lastWeek) return 'steady';
  return thisWeek > lastWeek ? 'up' : 'down';
}

// ---------------------------------------------------------------------------
// The "AI" seam. Stands in for an LLM call: given only the app-computed
// numbers and trend, return ONE encouraging sentence. Every candidate line
// here is written against the guardrails:
//   - never shames or guilts, on any week
//   - no medical / diet / clinical advice
//   - only references numbers the app actually provided
//   - honest when there's no prior week to compare to
//   - adds forward-looking framing instead of parroting the data row
// A small random pick per situation mimics the variability of a real model.
// ---------------------------------------------------------------------------
function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function generateMessage({ thisWeek, lastWeek, trend }) {
  // First week — nothing to compare to, so stay honest about that.
  if (trend === 'none' && (lastWeek === null || lastWeek === undefined)) {
    if (thisWeek === 0) {
      return pick([
        "A brand-new week is yours to shape — the first log is the only hard one.",
        "You're at the very start, and that's the perfect place to be. One day is all it takes to begin.",
      ]);
    }
    return pick([
      `${cap(word(thisWeek))} ${dayWord(thisWeek)} logged in your first week — a real beginning to build on.`,
      `You showed up ${word(thisWeek)} ${dayWord(thisWeek)} to start. That's a foundation, not a fluke — keep it going.`,
    ]);
  }

  // Flat at zero — no prior movement, but never a scold. Open the door forward.
  if (trend === 'none') {
    return pick([
      "This week is a clean slate, waiting for you. One small log is a great way in.",
      "Nothing logged yet, and that's okay — the next week is wide open and yours to start.",
    ]);
  }

  // Steady above zero — consistency is worth celebrating.
  if (trend === 'steady') {
    return pick([
      `${cap(word(thisWeek))} ${dayWord(thisWeek)} again this week — showing up that steadily is the whole game.`,
      `Same ${word(thisWeek)} ${dayWord(thisWeek)} as last week. That kind of consistency is exactly what carries you forward.`,
    ]);
  }

  // Up week — more than last week. Name the lift, look ahead.
  if (trend === 'up') {
    return pick([
      `${cap(word(thisWeek))} ${dayWord(thisWeek)} this week, up from ${word(lastWeek)} — you've found your rhythm again.`,
      `You climbed from ${word(lastWeek)} to ${word(thisWeek)} ${dayWord(thisWeek)}. That's real momentum heading into next week.`,
    ]);
  }

  // Down week — warm and forward-looking, never guilt-based.
  return pick([
    `${cap(word(thisWeek))} ${dayWord(thisWeek)} this week — every week resets, and this one is still yours to write.`,
    `You logged ${word(thisWeek)} ${dayWord(thisWeek)}, and that still counts. A fresh week is right around the corner.`,
  ]);
}

// Tiny helpers so the copy reads like prose, not a data dump.
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
function word(n) {
  return WORDS[n] ?? String(n);
}
function dayWord(n) {
  return n === 1 ? 'day' : 'days';
}
function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const TREND_DISPLAY = {
  up: { label: 'Up from last week', icon: TrendingUpIcon, color: '#4ADE80' },
  down: { label: 'Down from last week', icon: TrendingDownIcon, color: '#FBBF24' },
  steady: { label: 'Steady with last week', icon: TrendingFlatIcon, color: tokens.violetBright },
};

export default function WeeklySummary({ onOpenHistory }) {
  const [stateKey, setStateKey] = useState(TEST_STATES[0].key);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const state = useMemo(
    () => TEST_STATES.find((s) => s.key === stateKey) ?? TEST_STATES[0],
    [stateKey]
  );

  // App-computed values. The AI never touches these.
  const trend = useMemo(
    () => deriveTrend(state.thisWeek, state.lastWeek),
    [state]
  );

  // "Generate" the message whenever the selected state changes. We simulate the
  // latency of an LLM call (well under the 3s success bar) and show a spinner,
  // which is also where a real async fetch would live.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage('');
    const t = setTimeout(() => {
      if (!active) return;
      setMessage(
        generateMessage({
          thisWeek: state.thisWeek,
          lastWeek: state.lastWeek,
          trend,
        })
      );
      setLoading(false);
    }, 450);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [state, trend]);

  const handleChange = useCallback((_, next) => {
    if (next !== null) setStateKey(next);
  }, []);

  const trendMeta = trend !== 'none' ? TREND_DISPLAY[trend] : null;
  const TrendIcon = trendMeta?.icon;

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 3 }}>
      <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>
        This Week
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your progress at a glance.
      </Typography>

      {/* The summary card */}
      <Card id="weekly-summary-card">
        <CardContent sx={{ py: 4, px: { xs: 3, sm: 4 } }}>
          {/* Total days logged this week — the headline number */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Days logged this week
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: '3.5rem',
                fontWeight: 700,
                lineHeight: 1,
                color: 'text.primary',
              }}
            >
              {state.thisWeek}
            </Typography>
            <Typography component="span" variant="h6" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
              / 7
            </Typography>
          </Box>

          {/* Trend row — shown only when there's something honest to compare */}
          {trendMeta && (
            <Chip
              id="weekly-summary-trend"
              icon={<TrendIcon sx={{ fontSize: 18 }} />}
              label={trendMeta.label}
              sx={{
                mb: 3,
                fontFamily: '"Space Grotesk", sans-serif',
                letterSpacing: '0.06em',
                color: trendMeta.color,
                borderColor: 'divider',
                border: '1px solid',
                backgroundColor: tokens.accentDim08,
                '& .MuiChip-icon': { color: trendMeta.color },
              }}
              variant="outlined"
            />
          )}

          {/* The one AI-phrased sentence */}
          <Box
            id="weekly-summary-message"
            sx={{
              mt: trendMeta ? 0 : 1,
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              minHeight: 64,
            }}
          >
            <AutoAwesomeIcon sx={{ color: 'primary.light', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                <CircularProgress size={16} thickness={5} />
                <Typography variant="body2" color="text.secondary">
                  Writing your summary…
                </Typography>
              </Box>
            ) : (
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                {message}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {onOpenHistory && (
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={onOpenHistory}
          id="summary-history-button"
          sx={{ mt: 2 }}
        >
          View full history
        </Button>
      )}

      {/* Test-state switcher — click through the six situations */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}
        >
          Test states
        </Typography>
        <ToggleButtonGroup
          value={stateKey}
          exclusive
          onChange={handleChange}
          aria-label="Weekly summary test state"
          sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: '10px !important', border: '1px solid', borderColor: 'divider', px: 2 } }}
        >
          {TEST_STATES.map((s) => (
            <ToggleButton key={s.key} value={s.key} id={`test-state-${s.key}`} sx={{ fontSize: '0.72rem' }}>
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
