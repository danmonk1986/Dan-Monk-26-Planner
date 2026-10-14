import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import HistoryIcon from '@mui/icons-material/History';
import { tokens } from '../theme';
import useMode from '../hooks/useMode';
import { buildHistory, summarize, MODE_GROUPS, addDays } from '../data/baseline';

const heading = { fontFamily: '"Space Grotesk", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' };
const pct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const num = (v, d = 1) => (v == null ? '—' : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString());

const PERIODS = [
  { key: '7', label: '7 days', days: 7 },
  { key: '30', label: '30 days', days: 30 },
  { key: 'all', label: 'All', days: null },
];

// Columns for the HQ vs MWD table. `better` says which direction wins.
const COLUMNS = [
  { key: 'days', label: 'Days', fmt: (v) => num(v, 0) },
  { key: 'hitRate', label: 'On baseline', fmt: pct, better: 'high' },
  { key: 'completion', label: 'Non-Neg.', fmt: pct, better: 'high' },
  { key: 'viceLoad', label: 'Vice load / day', fmt: (v) => num(v), better: 'low' },
  { key: 'blocks', label: 'Blocks / day', fmt: (v) => num(v, 2), better: 'high' },
  { key: 'activityDays', label: 'Activity days', fmt: (v) => num(v, 0) },
];

function Tile({ label, value, sub, id }) {
  return (
    <Card id={id} sx={{ flex: '1 1 140px' }}>
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Typography sx={{ ...heading, fontSize: '0.65rem', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
        <Typography sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, fontSize: '1.8rem', lineHeight: 1.1, color: 'primary.light' }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

/**
 * Summary: the evidence. Baseline hit rate, vice load, bounce-back, and the
 * core question: how does HQ Dan compare with Work (MWD) Dan?
 */
export default function WeeklySummary({ entries = [], onOpenHistory }) {
  const { mode } = useMode();
  const [period, setPeriod] = useState('7');

  const history = useMemo(() => buildHistory(entries, mode), [entries, mode]);
  const { days: allDays, today, arc } = history;

  // Finished days inside the chosen period (today is shown separately)
  const p = PERIODS.find((x) => x.key === period);
  const from = p.days ? addDays(today, -p.days) : '0000-00-00';
  const inPeriod = allDays.filter((d) => d.day >= from && d.day < today);
  const overall = summarize(inPeriod);
  const todayRow = allDays.find((d) => d.day === today);

  const groups = MODE_GROUPS.map((g) => ({ ...g, stats: summarize(inPeriod.filter((d) => g.match(d.tag))) }))
    .filter((g) => !g.sub || g.stats.days > 0);
  const hq = groups.find((g) => g.key === 'hq')?.stats;
  const mwd = groups.find((g) => g.key === 'mwd')?.stats;

  // The biggest HQ vs MWD gap, in plain words (needs a few days of each)
  const insight = useMemo(() => {
    if (!hq || !mwd || hq.days < 3 || mwd.days < 3) return null;
    const cands = [
      { label: 'baseline hit rate', a: hq.hitRate, b: mwd.hitRate, scale: 1, fmt: pct, high: true },
      { label: 'Non-Negotiables done', a: hq.completion, b: mwd.completion, scale: 1, fmt: pct, high: true },
      { label: 'vice load per day', a: hq.viceLoad, b: mwd.viceLoad, scale: 3, fmt: (v) => num(v), high: false },
      { label: 'productivity blocks per day', a: hq.blocks, b: mwd.blocks, scale: 2, fmt: (v) => num(v, 2), high: true },
    ].filter((c) => c.a != null && c.b != null);
    if (!cands.length) return null;
    const top = cands.sort((x, y) => Math.abs(y.a - y.b) / y.scale - Math.abs(x.a - x.b) / x.scale)[0];
    if (top.a === top.b) return null;
    const mwdBetter = top.high ? top.b > top.a : top.b < top.a;
    return { ...top, mwdBetter };
  }, [hq, mwd]);

  const bestIn = (key, better) => {
    if (!better || !hq || !mwd || hq[key] == null || mwd[key] == null || hq[key] === mwd[key]) return null;
    return (better === 'high' ? hq[key] > mwd[key] : hq[key] < mwd[key]) ? 'hq' : 'mwd';
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 0.5 }}>Summary</Typography>
          <Typography variant="body2" color="text.secondary">What makes Work Dan function, and what comes home to HQ?</Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v)}
          size="small"
          aria-label="Period"
          id="summary-period"
          sx={{ '& .MuiToggleButton-root': { fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', px: 1.5, '&.Mui-selected': { backgroundColor: tokens.accentDim15, color: tokens.violetBright } } }}
        >
          {PERIODS.map((x) => <ToggleButton key={x.key} value={x.key} id={`summary-period-${x.key}`}>{x.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {/* Headline tiles */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Tile id="tile-hit-rate" label="On baseline" value={pct(overall.hitRate)} sub={`${overall.days} finished day${overall.days === 1 ? '' : 's'}`} />
        <Tile id="tile-run" label="Current run" value={num(arc.run, 0)} sub={arc.dipDays > 0 ? `in a dip · ${arc.dipDays} day${arc.dipDays > 1 ? 's' : ''}` : 'days on baseline'} />
        <Tile id="tile-vice-load" label="Vice load / day" value={num(overall.viceLoad)} sub={overall.days ? `${num(overall.viceLoad * 7)} per week` : 'no finished days yet'} />
        <Tile id="tile-bounce" label="Bounce-back" value={overall.bounceBack == null ? '—' : `${num(overall.bounceBack)}d`} sub={overall.dips ? `avg of ${overall.dips} dip${overall.dips > 1 ? 's' : ''}` : 'no dips recovered yet'} />
      </Box>

      {/* HQ vs MWD */}
      <Card sx={{ mb: 3 }} id="summary-modes">
        <CardContent>
          <Typography sx={{ ...heading, fontSize: '0.85rem', fontWeight: 700, mb: 2 }}>HQ vs MWD</Typography>

          {inPeriod.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Your first full day finishes at 4 AM (4 PM on nights). The comparison fills in from there, so live a few days in each mode.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { py: 1, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }, '& th:first-of-type, & td:first-of-type': { textAlign: 'left' } }}>
                <thead>
                  <tr>
                    <Box component="th" sx={{ ...heading, fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>Mode</Box>
                    {COLUMNS.map((c) => (
                      <Box component="th" key={c.key} sx={{ ...heading, fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>{c.label}</Box>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <Box component="tr" key={g.key} id={`summary-row-${g.key}`} sx={{ borderTop: `1px solid ${tokens.borderViolet}` }}>
                      <Box component="td" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: g.sub ? 500 : 700, fontSize: g.sub ? '0.8rem' : '0.9rem', pl: g.sub ? 3 : 1, color: g.sub ? 'text.secondary' : 'text.primary' }}>
                        {g.label}
                      </Box>
                      {COLUMNS.map((c) => {
                        const wins = !g.sub && bestIn(c.key, c.better) === g.key;
                        return (
                          <Box component="td" key={c.key} sx={{ fontSize: g.sub ? '0.8rem' : '0.9rem', color: wins ? 'primary.light' : g.sub ? 'text.secondary' : 'text.primary', fontWeight: wins ? 700 : 400 }}>
                            {g.stats.days ? c.fmt(g.stats[c.key]) : '—'}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}

          {/* Plain-words takeaway */}
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: tokens.accentDim08, border: `1px solid ${tokens.borderViolet}` }} id="summary-insight">
            <Typography variant="body2" sx={{ color: insight ? 'text.primary' : 'text.secondary' }}>
              {insight
                ? `Biggest gap: ${insight.label}. HQ ${insight.fmt(insight.a)} vs MWD ${insight.fmt(insight.b)}. ${insight.mwdBetter ? 'Work Dan has the edge here: what about the rig makes this easier, and how do you bring it home?' : 'HQ Dan has the edge here: what is it about home that helps, and can any of it travel to the rig?'}`
                : 'Teal marks the better mode in each column. A takeaway appears once you have at least 3 finished days in both HQ and MWD.'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Today so far */}
      {todayRow && (
        <Card sx={{ mb: 3 }} id="summary-today">
          <CardContent sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <Typography sx={{ ...heading, fontSize: '0.8rem', fontWeight: 700 }}>Today so far</Typography>
            <Typography variant="body2" color="text.secondary">
              Non-Negotiables <Box component="span" sx={{ color: 'text.primary' }}>{todayRow.done}/{todayRow.total}</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vice load <Box component="span" sx={{ color: 'text.primary' }}>{num(todayRow.vices)}/{num(todayRow.limit)}</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Blocks <Box component="span" sx={{ color: 'text.primary' }}>{num(todayRow.blocks, 2)}</Box>
            </Typography>
            <Typography variant="body2" sx={{ color: todayRow.meets ? 'primary.light' : 'text.secondary', fontWeight: 600 }}>
              {todayRow.meets ? 'On baseline' : 'Not on baseline yet'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {onOpenHistory && (
        <Button variant="outlined" startIcon={<HistoryIcon />} onClick={onOpenHistory} id="summary-history-button">
          View full history
        </Button>
      )}
    </Box>
  );
}
